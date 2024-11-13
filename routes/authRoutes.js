const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = Router();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = (db) => {
  router.post('/register', async (req, res) => {
    try {
      const { nombres, apellidos, email, password, fechaNacimiento } = req.body;

      if (!nombres || !apellidos || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
      }

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const result = await db.collection('users').insertOne({
        nombres,
        apellidos,
        email,
        password: hashedPassword,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        createdAt: new Date()
      });

      const token = jwt.sign({ id: result.insertedId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      res.status(201).json({
        _id: result.insertedId,
        nombres,
        apellidos,
        email,
        token
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      res.status(200).json({
        _id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        token
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};