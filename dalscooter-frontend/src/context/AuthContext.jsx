import React, { createContext, useContext, useState } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

const AuthContext = createContext();
const poolData    = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId:   import.meta.env.VITE_CLIENT_ID
};
const userPool = new CognitoUserPool(poolData);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [pendingUser, setPendingUser] = useState(null);
  const [challengeParams, setChallengeParams] = useState(null);

  const clearChallengeParams = () => {
    setChallengeParams(null);
    setPendingUser(null);
  };


  const register = ({ name, email, password, question, answer }) => {

    return new Promise((res, rej) => {
      const attrs = [
        new CognitoUserAttribute({ Name: 'username',        Value: email }),
        new CognitoUserAttribute({ Name: 'email',             Value: email }),
        new CognitoUserAttribute({ Name: 'name',              Value: name }),
        new CognitoUserAttribute({ Name: 'custom:secQuestion',Value: question }),
        new CognitoUserAttribute({ Name: 'custom:secAnswer',  Value: answer })
      ];
      userPool.signUp(email, password, attrs, null, (err, result) => {
        if (err) rej(err);
        else    res(result.user);
      });
    });
  };

  // ─── CONFIRM SIGNUP (OTP) ────────────────────────────────────
  const confirmSignUp = ({ email, code }) => {
    return new Promise((res, rej) => {
        console.log('Confirming signup for:', email, 'with code:', code, );
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) rej(err);
        else    res(result);
      });
    });
  }

  // ─── RESEND CONFIRM CODE ────────────────────────────────────
  const resendConfirmationCode = email => {
    return new Promise((res, rej) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) rej(err);
        else    res(result);
      });
    });
  };

  // ─── LOGIN (SRP + CUSTOM_CHALLENGE) ─────────────────────────
  const login = async({ email, password }) => {
  return new Promise((res, rej) => {
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

    setPendingUser(cognitoUser);
    cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: session => {
        const usr = { email, session };
        setUser(usr);
        localStorage.setItem('user', JSON.stringify(usr));
        clearChallengeParams();
        res(null);
      },
      onFailure: err => rej(err),
      customChallenge: params => {
        setPendingUser(cognitoUser);
        console.log('Custom challenge received:', params);
        setChallengeParams(params);
        res({type: params.challenge_type});
      }
    });
  });
};

  // ─── RESPOND TO CUSTOM_CHALLENGE ─────────────────────────────
  const respondChallenge = ({ answer }) => {
    return new Promise((res, rej) => {
      if (!pendingUser) {
        return rej(new Error('No pending challenge'));
      }

      // normalize answer
      const ans = String(answer).trim().toLowerCase();

      pendingUser.sendCustomChallengeAnswer(ans, {
        onSuccess: session => {
          // either another custom-challenge or final onSuccess
          const username = pendingUser.getUsername();
          const usr = { email: username, session };
          setUser(usr);
          localStorage.setItem('user', JSON.stringify(usr));
          clearChallengeParams();
          res(null); 
        },
        onFailure: err => rej(err),
        customChallenge: (params) => {
          console.log('Custom challenge received:', params);
          setChallengeParams(params);
          res({type: params.challenge_type});
        }
      });
    });
  };

  // ─── LOGOUT ────────────────────────────────────────────────
  const logout = () => {
    const cur = userPool.getCurrentUser();
    cur?.signOut();
    setUser(null);
    clearChallengeParams();
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      register,
      confirmSignUp,
      resendConfirmationCode,
      login,
      respondChallenge,
      logout,
      challengeParams,
      clearChallengeParams 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}