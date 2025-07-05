// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId:   import.meta.env.VITE_CLIENT_ID
};
const userPool = new CognitoUserPool(poolData);

const AuthContext = createContext();
// holds the active CognitoUser (and for CUSTOM_AUTH we’ll stash the password too)
const userRef = { current: null };

export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(() => {
    const s = localStorage.getItem('authUser');
    return s ? JSON.parse(s) : null;
  });
  const [challengeParams, setChallengeParams] = useState(null);

  useEffect(() => {
    if (user)    localStorage.setItem('authUser', JSON.stringify(user));
    else         localStorage.removeItem('authUser');
  }, [user]);

  // ---- Registration / Confirmation ----

  const register = ({ username, password, attributes }) =>
    new Promise((res, rej) => {
      const attrs = Object.entries(attributes).map(
        ([Name, Value]) => new CognitoUserAttribute({ Name, Value })
      );
      userPool.signUp(username, password, attrs, null, (err, data) => {
        err ? rej(err) : res(data.user);
      });
    });

  const confirmSignUp = ({ username, code }) =>
    new Promise((res, rej) => {
      const u = new CognitoUser({ Username: username, Pool: userPool });
      u.confirmRegistration(code, true, (err, data) => {
        err ? rej(err) : res(data);
      });
    });

  const resendConfirmationCode = (username) =>
    new Promise((res, rej) => {
      const u = new CognitoUser({ Username: username, Pool: userPool });
      u.resendConfirmationCode((err, data) => {
        err ? rej(err) : res(data);
      });
    });

  // ---- Sign In & Custom MFA Flow ----

  const signIn = ({ username, password }) =>
  new Promise((resolve, reject) => {
    // 1) Build the CognitoUser and stash it for later challenge responses
    const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
    userRef.current = cognitoUser;

    // 2) Kick off the CUSTOM_AUTH flow, sending both USERNAME & PASSWORD
    cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
    cognitoUser.initiateAuth(
      {
        AuthFlow: 'CUSTOM_AUTH',
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password
        },
        // optional: pass password into DefineAuthChallenge via clientMetadata
        ClientMetadata: { PASSWORD: password }
      },
      {
        onSuccess: session => {
          // no more challenges left
          setUser({ username, session });
          userRef.current = null;
          setChallengeParams(null);
          resolve(null);
        },
        onFailure: err => {
          reject(err);
        },
        customChallenge: params => {
          // Cognito is asking your first custom challenge (QA)
          setChallengeParams(params);
          resolve('CUSTOM_CHALLENGE');
        }
      }
    );
  });

  const respondToChallenge = (answer) =>
    new Promise((res, rej) => {
      const entry = userRef.current;
      if (!entry) return rej(new Error('No pending challenge'));
      const { cognitoUser } = entry;

      cognitoUser.sendCustomChallengeAnswer(answer, {
        onSuccess: session => {
          setUser({ username: cognitoUser.getUsername(), session });
          userRef.current = null;
          setChallengeParams(null);
          res(null);
        },
        onFailure: err => rej(err),
        customChallenge: params => {
          // if there's another challenge (i.e. Caesar after QA)
          setChallengeParams(params);
          res('CUSTOM_CHALLENGE');
        }
      });
    });

  // ---- Sign Out ----

  const signOut = () => {
    const cur = userPool.getCurrentUser();
    cur?.signOut();
    setUser(null);
    setChallengeParams(null);
    userRef.current = null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      challengeParams,
      register,
      confirmSignUp,
      resendConfirmationCode,
      signIn,
      respondToChallenge,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
