const revokedTokens = new Map();

const revokeToken = (tokenId, expiresAt) => {
  if (!tokenId || !expiresAt) {
    return;
  }

  revokedTokens.set(tokenId, expiresAt);
};

const isTokenRevoked = (tokenId) => {
  if (!tokenId) {
    return true;
  }

  const expiresAt = revokedTokens.get(tokenId);

  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= Math.floor(Date.now() / 1000)) {
    revokedTokens.delete(tokenId);
    return false;
  }

  return true;
};

module.exports = {
  revokeToken,
  isTokenRevoked
};
