import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc'; 
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi'; 
import { useGoogleLogin } from '@react-oauth/google'; 
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: SyntheticEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('API Response:', data);
        localStorage.setItem('user', data.user.username);
        navigate('/home');
      } else {
        alert(data.msg || '登入失敗');
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('連線錯誤，請確認後端 Server 是否開啟');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 使用 Access Token 取得使用者資訊
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        console.log('Google User:', userInfo.data);
        
        // 呼叫後端 API 進行 Google 登入/註冊
        const res = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: userInfo.data.email, 
            name: userInfo.data.name, 
            googleId: userInfo.data.sub 
          }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
           localStorage.setItem('user', data.user.username);
           navigate('/home');
        }

      } catch (error) {
        console.error('Google Login Error:', error);
      }
    },
    onError: () => console.log('Login Failed'),
  });

  return (
    <div className="login-wrapper">
        <div className="login-card">
            <div className="login-left">
            <div className="interactive-visual">
                <div className="bar bar1"></div>
                <div className="bar bar2"></div>
                <div className="bar bar3"></div>
                <div className="bar bar4"></div>
                <div className="bar bar5"></div>
            </div>
            <h2 className="brand-slogan">聽見你的聲音</h2>
            </div>

            <div className="login-right">
            <div className="login-form-container">
                <div className="login-header">
                <div className="logo-circle"></div>
                <h1>開始您的音樂旅程</h1>
                </div>

                <form onSubmit={handleLogin}>
                {/* Username 欄位 */}
                <div className="input-group">
                    <label>Name</label>
                    <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input 
                        type="text" 
                        placeholder="您的暱稱 (初次登入請填寫)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    </div>
                </div>

                {/* Email 欄位 */}
                <div className="input-group">
                    <label>Email</label>
                    <div className="input-wrapper">
                    <FiMail className="input-icon" />
                    <input 
                        type="email" 
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    </div>
                </div>

                {/* Password 欄位 */}
                <div className="input-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="button" 
                        className="toggle-eye"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FiEye /> : <FiEyeOff />}
                    </button>
                    </div>
                </div>

                <button type="submit" className="login-btn">
                    登入/註冊
                </button>
                </form>

                <div className="divider">
                <span>Or continue with</span>
                </div>

                <button className="google-btn"  onClick={() => googleLogin()}>
                <FcGoogle size={20} /> 使用 Google 帳號登入
                </button>
            </div>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;