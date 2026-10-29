import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, googleIdentityApi } from './api';
import { FcGoogle } from 'react-icons/fc'; 
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi'; 
import { useGoogleLogin } from '@react-oauth/google'; 
import logoImage from '../../assets/images/login-logo.png';
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
      const data = await authApi.login({ username, email, password });
      localStorage.setItem('user', data.user.username);
      navigate('/home');

    } catch (error) {
      console.error('Login error:', error);
      alert(error instanceof Error ? error.message : '登入失敗，請稍後再試');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 使用 Access Token 取得使用者資訊
        const userInfo = await googleIdentityApi.profile(tokenResponse.access_token);
        
        const data = await authApi.googleLogin({
          email: userInfo.email,
          name: userInfo.name,
          googleId: userInfo.sub,
        });
        localStorage.setItem('user', data.user.username);
        navigate('/home');

      } catch (error) {
        console.error('Google Login Error:', error);
        alert(error instanceof Error ? error.message : 'Google 登入失敗');
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
            <h2 className="brand-slogan">I can hear you.</h2>
            </div>

            <div className="login-right">
            <div className="login-form-container">
                <div className="login-header">
                <img src={logoImage} alt="OnomaRise Logo" className="login-logo-img" />
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
