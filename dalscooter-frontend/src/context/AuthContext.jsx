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
  const [selectedRole, setSelectedRole] = useState(null); // Add this

  const clearChallengeParams = () => {
    setChallengeParams(null);
    setPendingUser(null);
    setSelectedRole(null); // Clear selected role too
  };

  // Helper function to get user role from token
  const getUserRole = (session) => {
    try {
      const idToken = session.getIdToken().getJwtToken();
      console.log('ID Token:', idToken); // Debug log
      
      // Fix: Handle URL encoding in JWT token
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format');
        return 'RegisteredCustomer';
      }
      
      // Decode the payload with proper base64 padding
      let payload = parts[1];
      // Add padding if necessary
      while (payload.length % 4) {
        payload += '=';
      }
      
      const decodedPayload = JSON.parse(atob(payload));
      console.log('Token payload:', decodedPayload); // Debug log
      
      const groups = decodedPayload['cognito:groups'];
      console.log('Groups from token:', groups); // Debug log
      
      if (Array.isArray(groups)) {
        if (groups.includes('FranchiseOperator')) {
          return 'FranchiseOperator';
        } else if (groups.includes('RegisteredCustomer')) {
          return 'RegisteredCustomer';
        }
      } else if (typeof groups === 'string') {
        if (groups === 'FranchiseOperator') {
          return 'FranchiseOperator';
        } else if (groups === 'RegisteredCustomer') {
          return 'RegisteredCustomer';
        }
      }
      
      // Also check custom:role as fallback
      const customRole = decodedPayload['custom:role'];
      console.log('Custom role:', customRole); // Debug log
      
      if (customRole === 'FranchiseOperator') {
        return 'FranchiseOperator';
      }
      
      return 'RegisteredCustomer'; // Default
    } catch (error) {
      console.error('Error parsing token:', error);
      return 'RegisteredCustomer';
    }
  };

  const register = ({ name, email, password, question, answer, role, caesarText, shiftKey }) => {

    return new Promise((res, rej) => {
      const attrs = [
        new CognitoUserAttribute({ Name: 'username', Value: email }),
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
        new CognitoUserAttribute({ Name: 'custom:secQuestion',Value: question }),
        new CognitoUserAttribute({ Name: 'custom:secAnswer',  Value: answer }),
        new CognitoUserAttribute({ Name: 'custom:role',      Value: role }),
        new CognitoUserAttribute({ Name: 'custom:plainText', Value: caesarText }),
        new CognitoUserAttribute({ Name: 'custom:shiftKey',   Value: shiftKey })
      ];
      userPool.signUp(email, password, attrs, null, (err, result) => {
        if (err) rej(err);
        else    res(result.user);
      });
    });
  };

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

  const resendConfirmationCode = email => {
    return new Promise((res, rej) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) rej(err);
        else    res(result);
      });
    });
  };

  const login = async({ email, password, role = null }) => {
  return new Promise((res, rej) => {
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

    setPendingUser(cognitoUser);
    setSelectedRole(role); // Store selected role
    cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: session => {
        const detectedRole = getUserRole(session);
        const usr = { 
          email, 
          session, 
          role: detectedRole,
          selectedRole: role, // Store both detected and selected role
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken()
        };
        setUser(usr);
        localStorage.setItem('user', JSON.stringify(usr));
        clearChallengeParams();
        res({ success: true, role: detectedRole, selectedRole: role });
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

  const respondChallenge = ({ answer }) => {
    return new Promise((res, rej) => {
      if (!pendingUser) {
        return rej(new Error('No pending challenge'));
      }

      const ans = String(answer).trim().toLowerCase();

      pendingUser.sendCustomChallengeAnswer(ans, {
        onSuccess: session => {
          const username = pendingUser.getUsername();
          const detectedRole = getUserRole(session);
          const usr = { 
            email: username, 
            session, 
            role: detectedRole,
            selectedRole: selectedRole, // Use stored selected role
            idToken: session.getIdToken().getJwtToken(),
            accessToken: session.getAccessToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken()
          };
          setUser(usr);
          localStorage.setItem('user', JSON.stringify(usr));
          clearChallengeParams();
          res({ success: true, role: detectedRole, selectedRole: selectedRole }); 
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
      clearChallengeParams,
      getUserRole,
      selectedRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}