import axios from 'axios';
import React, { useState } from 'react';
import { buildPath } from './Path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [message, setMessage] = useState('');
  const [email, setLoginName] = React.useState('');
  const [loginPassword, setPassword] = React.useState('');

  async function doLogin(event: any): Promise<void> {
    event.preventDefault();
    const obj = { login: email, password: loginPassword };

    try {
      const response = await axios.post(buildPath('api/login'), obj, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { accessToken } = response.data;
      storeToken(response.data);

      try {
        const decoded: any = jwtDecode(accessToken);

        const userId = decoded.userId;
        const firstName = decoded.firstName;
        const lastName = decoded.lastName;

        if (userId <= 0) {
          setMessage('User/Password combination incorrect');
        } else {
          const user = { firstName, lastName, id: userId };
          localStorage.setItem('user_data', JSON.stringify(user));
          setMessage('');
          window.location.href = '/cards';
        }
      } catch (e) {
        console.log(e);
        return;
      }
    } catch (error: any) {
      alert(error.toString());
      return;
    }
  }

  function handleSetLoginName(e: any): void {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">Log in</span><br />
      Email: <input type="text" id="loginName" placeholder="Email" onChange={handleSetLoginName} /><br />
      Password: <input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword} />
      <button type="button" id="loginButton" className="buttons" onClick={doLogin}>  Log In </button>
      <span id="loginResult">{message}</span>
    </div>
  );
}

export default Login;