export function getHello(req, res) {
  res.status(200).send('get hello successful');
}

export function postHello(req, res) {
  res.status(200).send('post hello successful');
}

export function getBye(req, res) {
  res.status(200).send('get bye successful');
}

export function postBye(req, res) {
  res.status(200).send('post bye successful');
}
