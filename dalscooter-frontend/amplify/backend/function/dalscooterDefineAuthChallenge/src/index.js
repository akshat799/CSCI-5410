exports.handler = async (event) => {
  const session = event.request.session || [];

  if (session.length >= 5) {
    event.response.failAuthentication = true;
    event.response.issueTokens = false;
    return event;
  }

  if (session.length === 0) {
    event.response.challengeName = 'CUSTOM_CHALLENGE'; // Security Q
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
  } else if (session.length === 1 && session[0].challengeResult === true) {
    event.response.challengeName = 'CUSTOM_CHALLENGE'; // Caesar cipher
    event.response.issueTokens = false;
    event.response.failAuthentication = false;
  } else if (session.length === 2 && session[1].challengeResult === true) {
    event.response.issueTokens = true;
    event.response.failAuthentication = false;
  } else {
    event.response.failAuthentication = true;
    event.response.issueTokens = false;
  }

  return event;
};
