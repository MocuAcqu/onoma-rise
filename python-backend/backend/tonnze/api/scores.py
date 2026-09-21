import json
import shutil
import threading
import warnings
from contextlib import closing
from pathlib import Path
from uuid import UUID, uuid4

import pypdfium2 as pdfium
from PIL import Image
from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from music21 import converter
from tonnze.rules.marks import notation_marks
from tonnze.rules.articulations import articulation_events
from tonnze.rules.ornaments import ornament_events
from tonnze.rules.performance import performance_events

from tonnze.repositories import jobs
from tonnze.config import DATA, ENABLE_OCR, ENABLE_YOLO, MAX_BYTES

router = APIRouter()
db = jobs.connection()
Image.MAX_IMAGE_PIXELS = 25_000_000
pdf_lock = threading.Lock()  # PDFium requires serialized calls within a process.


@router.get('/api/scores/health')
def health():
    engines = ['homr']
    if ENABLE_OCR:
        engines.append('RapidOCR')
    if ENABLE_YOLO:
        engines.append('YOLO')
    return {
        'api': True,
        'worker': jobs.worker_alive(db),
        'engine': ' + '.join(engines),
        'features': {'ocr': ENABLE_OCR, 'yolo': ENABLE_YOLO},
    }


def validate_source(path, suffix):
    try:
        if suffix == '.pdf':
            with pdf_lock, closing(pdfium.PdfDocument(path)) as document:
                if len(document) != 1:
                    raise HTTPException(400, '第一版支援單頁 PDF，請先拆成單頁再上傳。')
        else:
            with warnings.catch_warnings():
                warnings.simplefilter('error', Image.DecompressionBombWarning)
                with Image.open(path) as image:
                    if image.format != 'PNG':
                        raise HTTPException(400, '圖片內容不是 PNG，請轉存為 PNG 後重試。')
                    if min(image.size) < 100:
                        raise HTTPException(400, '圖片太小，請使用清晰、完整的樂譜圖片。')
                    image.verify()
    except HTTPException:
        raise
    except (Image.DecompressionBombWarning, Image.DecompressionBombError):
        raise HTTPException(400, '圖片解析度過高，請縮小至 2,500 萬像素以內。')
    except Exception:
        raise HTTPException(400, '無法讀取檔案，請確認格式正確，且 PDF 未加密。')


@router.post('/api/jobs', status_code=202)
def upload(file: UploadFile):
    suffix = Path(file.filename or '').suffix.lower()
    work = None
    try:
        if suffix not in {'.png', '.pdf'}:
            raise HTTPException(400, f'請上傳 PNG 或單頁 PDF。你上傳的是: {suffix}')
        job_id = str(uuid4())
        work = DATA / job_id
        work.mkdir(parents=True)
        source = work / ('source' + suffix)
        size = 0
        with source.open('wb') as target:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_BYTES:
                    raise HTTPException(413, '檔案不可超過 20 MB。')
                target.write(chunk)
        if size == 0:
            raise HTTPException(400, '檔案是空的，請重新選擇。')
        validate_source(source, suffix)
        try:
            job = jobs.create_job(db, job_id, Path(file.filename).name[:200], suffix)
        except ValueError as error:
            raise HTTPException(429, str(error))
        # Do not delete an accepted job if the response connection is interrupted.
        work = None
        return jobs.public_job(db, job)
    finally:
        file.file.close()
        if work is not None:
            shutil.rmtree(work, ignore_errors=True)


def require_job(job_id):
    job = jobs.get_job(db, str(job_id))
    if not job:
        raise HTTPException(404, '找不到這份工作，檔案可能已過期清除。')
    return job


@router.get('/api/jobs/{job_id}')
def status(job_id: UUID):
    return jobs.public_job(db, require_job(job_id))


@router.post('/api/jobs/{job_id}/cancel')
def cancel(job_id: UUID):
    require_job(job_id)
    job = jobs.cancel(db, str(job_id))
    if not job:
        raise HTTPException(404, '工作已過期。')
    return jobs.public_job(db, job)


@router.get('/api/jobs/{job_id}/files/{kind}')
def download(job_id: UUID, kind: str):
    job = require_job(job_id)
    if kind == 'source':
        path = DATA / str(job_id) / ('source' + job['suffix'])
        media = 'application/pdf' if job['suffix'] == '.pdf' else 'image/png'
        name = job['filename']
    elif kind in {'midi', 'musicxml', 'diagnostics'}:
        if job['status'] != 'complete':
            raise HTTPException(409, '辨識尚未完成。')
        extension, media = {
            'midi': ('mid', 'audio/midi'),
            'musicxml': ('musicxml', 'application/vnd.recordare.musicxml+xml'),
            'diagnostics': ('json', 'application/json'),
        }[kind]
        path = DATA / str(job_id) / (('diagnostics' if kind == 'diagnostics' else 'result') + '.' + extension)
        name = Path(job['filename']).stem + '.' + extension
    else:
        raise HTTPException(404, '沒有這種檔案。')
    if not path.is_file():
        raise HTTPException(404, '檔案不存在或已清除。')
    return FileResponse(path, media_type=media, filename=name,
                        content_disposition_type='inline' if kind == 'source' else 'attachment',
                        headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'})


def notation_path(job_id):
    if require_job(job_id)['status'] != 'complete':
        raise HTTPException(409, '辨識尚未完成。')
    path = DATA / str(job_id) / 'result.musicxml'
    if not path.is_file():
        raise HTTPException(404, '樂譜不存在或已清除。')
    return path


@router.get('/api/jobs/{job_id}/notation')
def score_notation(job_id: UUID):
    path = notation_path(job_id)
    metadata = DATA / str(job_id) / 'result.json'
    categories = {'articulations', 'marks', 'ornaments', 'performance'}
    if metadata.is_file():
        result = json.loads(metadata.read_text(encoding='utf-8'))
        if result.get('notation'):
            notation = dict(result['notation'])
            missing = categories - notation.keys()
            if not missing:
                return notation
            # Older completed jobs can have a partial cache. Derive only the
            # missing categories so they receive new rules without rerunning
            # the expensive recognition pipeline.
            score = converter.parse(path) if missing - {'ornaments'} else None
            if 'articulations' in missing:
                notation['articulations'] = articulation_events(score)
            if 'marks' in missing:
                notation['marks'] = notation_marks(score)
            if 'ornaments' in missing:
                notation['ornaments'] = ornament_events(path)
            if 'performance' in missing:
                notation['performance'] = performance_events(score, result.get('terms', []))
            return notation
        terms = result.get('terms', [])
    else:
        terms = []
    # Compatibility path for jobs produced before notation events were cached.
    score = converter.parse(path)
    return {
        'articulations': articulation_events(score),
        'marks': notation_marks(score),
        'ornaments': ornament_events(path),
        'performance': performance_events(score, terms),
    }
