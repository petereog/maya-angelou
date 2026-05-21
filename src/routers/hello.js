import express from 'express';

const helloRoute = express.Router();

helloRoute.get('/hello', (req, res) => {
	res.send('this is the hello from router');
});

export default helloRoute;