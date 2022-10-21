import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const Authorization = req.get('Authorization');
  try {
    jwt.verify(Authorization, process.env.SECRET_KEY);
    next();
  } catch ({ name, message }) {
    if (name === 'TokenExpiredError') {
      // consider implementing token blacklist and ttl
      const { username, email, stripeCusId } = jwt.decode(Authorization);
      const refreshToken = jwt.sign({
        // expires after 10 mins
        exp: Math.floor(Date.now() / 1000) + (60 * 10),
        user: {
          username,
          email,
          stripeCusId,
        }
      }, process.env.SECRET_KEY);
      res.cookie('refreshToken', refreshToken);
      res.redirect('/login');
    }
    res.redirect('/login');
  }
}
