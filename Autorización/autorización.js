const dotenv = require('dotenv');
const jsonwebtoken = require('jsonwebtoken');

dotenv.config();

async function loggeado(req, res, next) {
    try {
        const estaLoggeado = await verificar(req);
        if (estaLoggeado) {
            return next();
        }
        return res.redirect("/");
    } catch (error) {
        console.error('Error en verificación:', error);
        return res.redirect("/");
    }
}

async function nologgeado(req, res, next) {
    try {
        const estaLoggeado = await verificar(req);
        if (!estaLoggeado) {
            return next();
        }
        return res.redirect("/");
    } catch (error) {
        console.error('Error en verificación:', error);
        return next();
    }
}

async function verificar(req) {
    try {
        if (!req.headers.cookie) return false;
        
        const cookies = req.headers.cookie.split(";").map(c => c.trim());
        const sessionCookie = cookies.find(cookie => cookie.startsWith("cookiesesion="));
        
        if (!sessionCookie) return false;
        
        const token = sessionCookie.split("=")[1];
        const decodificada = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        
        const response = await fetch("http://localhost:3000/verificar", {
            method: "GET",
            headers: {
                "Cookie": `cookiesesion=${token}`
            }
        });
        
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Error en verificación:', error);
        return false;
    }
}

module.exports = {
    loggeado,
    nologgeado
}