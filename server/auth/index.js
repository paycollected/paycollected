import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const Authorization = req.get('Authorization');
  console.log('------------>', Authorization);
  try {
    const {
      exp,
      user: { username, stripeCusId, email }
    } = jwt.verify(Authorization, process.env.SECRET_KEY);
    if (exp < (Date.now() / 1000 - 30)) {
      const refreshToken = jwt.sign({
        // expires after 10 mins
        exp: Math.floor(Date.now() / 1000) + (60 * 1),
        user: {
          username,
          email,
          stripeCusId,
        }
      }, process.env.SECRET_KEY);
      console.log(refreshToken);
      res.cookie('refreshToken', refreshToken);
    }
    next();
  } catch (e) {
    // console.log(e);
    res.redirect('/login');
  }
}
