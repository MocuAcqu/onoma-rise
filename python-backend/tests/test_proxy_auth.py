from tonnze.proxy_auth import valid_proxy_token


def test_proxy_token_is_optional_for_local_development():
    assert valid_proxy_token("", None)


def test_proxy_token_must_match_when_configured():
    assert valid_proxy_token("shared-secret", "shared-secret")
    assert not valid_proxy_token("shared-secret", None)
    assert not valid_proxy_token("shared-secret", "wrong-secret")
