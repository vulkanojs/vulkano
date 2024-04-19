module.exports = (socket, next) => {

  // Security
  const user = Jwt.socket(socket);

  const {
    _id
  } = user || {};

  if (!_id) {
    console.log('Sockets Middleware: Invalid ID');
    next(new Error(`Invalid user ${_id || 'or token'}`));
  }

  // eslint-disable-next-line no-param-reassign
  socket.request.user = user || {};

  next();

};
