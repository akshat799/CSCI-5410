exports.handler = async (event) => {
  const expectedAnswer = event.request.privateChallengeParameters.answer;
  const userAnswer = event.request.challengeAnswer?.trim().toLowerCase();

  event.response.answerCorrect = userAnswer === expectedAnswer;
  return event;
};
