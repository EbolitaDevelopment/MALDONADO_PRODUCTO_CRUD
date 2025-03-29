//Maldonado Alcala Leonardo 6IV8 
const express = require("express")
const dotenv = require("dotenv")
const mysql = require("mysql2")
const bodyParser = require('body-parser')
const path = require("path")
const jsonwebtoken = require("jsonwebtoken")
const cookieParser = require('cookie-parser')
const {loggeado, nologgeado} = require("./Autorización/autorización.js")

var app = express()
dotenv.config()

var con = mysql.createConnection({
    host: process.env.HOST_DB,
    user: process.env.USER_SECRET_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE_DB,
    port: process.env.PORT_DB
})
con.connect();

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.json())

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "paginas/index.html")))
app.get("/control",loggeado ,(req, res) => res.sendFile(path.join(__dirname, "paginas/control.html")))
app.get("/registro",nologgeado,(req, res) => res.sendFile(path.join(__dirname, "paginas/registro.html")))
app.get("/isesion", nologgeado,(req, res) => res.sendFile(path.join(__dirname, "paginas/login.html")))

//******************************************************************************************************************* */
function contieneEtiquetaHTML(texto) {
    return /<[^>]+>/.test(texto);
}
function validarTexto(texto) {
    return /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]{1,30}$/.test(texto);
}
function validarContraseña(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
}
function validarUsuario(usuario) {
    return /^[a-zA-Z0-9]{1,30}$/.test(usuario);
}
//******************************************************************************************************************* */
app.post('/agregarUsuario', async (req, res) => {
    try {
        let { nombre, apellidop, apellidom, edad, posicion, peso, altura, nacionalidad, usuario, password, password2 } = req.body;

        if (![nombre, apellidop, apellidom, edad, posicion, peso, altura, nacionalidad, usuario, password, password2].every(Boolean)) {
            return res.status(400).send({ message: "Faltan parámetros o hay datos manipulados en el registro" });
        }

        edad = parseInt(edad);
        posicion = parseInt(posicion);
        peso = parseInt(peso);
        altura = parseInt(altura);

        if (contieneEtiquetaHTML(nombre) || contieneEtiquetaHTML(apellidom) || contieneEtiquetaHTML(apellidop) || contieneEtiquetaHTML(nacionalidad)
            || isNaN(edad) || isNaN(posicion) || isNaN(peso) || isNaN(altura) || contieneEtiquetaHTML(usuario) || contieneEtiquetaHTML(password) || contieneEtiquetaHTML(password2)) {
            return res.status(400).send({ message: "No intentes adulterar la solicitud" });
        }

        if (edad < 10 || edad > 100 || posicion < 1 || posicion > 5 || peso < 1 || peso > 300 || altura < 1 || altura > 300) {
            return res.status(400).send({ message: "Datos Incorrectos" });
        }

        if (!validarTexto(nombre) || !validarTexto(apellidom) || !validarTexto(apellidop) || !validarTexto(nacionalidad)) {
            return res.status(400).send({ message: "Solo puedes ingresar texto de entre 1 y 30 caracteres" });
        }
        if (!validarContraseña(password)) {
            return res.status(400).send({ message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número" });
        }
        if (password !== password2) {
            return res.status(400).send({ message: "Las contraseñas no coinciden" });
        }
        if (!validarUsuario(usuario)) {
            return res.status(400).send({ message: "El usuario debe ser alfanumérico de entre 1 y 30 caracteres" });
        }

        const checkUser = () => {
            return new Promise((resolve, reject) => {
                con.query('SELECT * FROM usuario WHERE usuario = ?', [usuario], (err, respuesta) => {
                    if (err) reject(err);
                    resolve(respuesta);
                });
            });
        };

        const userExists = await checkUser();
        if (userExists.length > 0) {
            return res.status(400).send({ message: "El usuario ya existe" });
        }

        const insertUser = () => {
            return new Promise((resolve, reject) => {
                con.query('INSERT INTO usuario (usuario, nombre, apellidopaterno, apellidomaterno, edad, posición, altura, peso, nacionalidad, contraseña) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [usuario, nombre, apellidop, apellidom, edad, posicion, altura, peso, nacionalidad, password],
                    (err, respuesta) => {
                        if (err) reject(err);
                        resolve(respuesta);
                    });
            });
        };

        await insertUser();
        const token = jsonwebtoken.sign({ user: usuario}, process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION })
        const cookieOption = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        }
        res.cookie("cookiesesion", token, cookieOption)
        return res.status(202).send({ message: 'ok', nombre: ` ${nombre}`, apellidopaterno: `${apellidop}`, nacionalidad: `${nacionalidad}`,redireccion: "/" });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: "Error en los campos" });
    }
});
//******************************************************************************************************************* */
app.get('/obtenerUsuario', async (req, res) => {
    try {
        const obtenerUsuarios = () => {
            return new Promise((resolve, reject) => {
                con.query('SELECT id, usuario, nombre, apellidopaterno, apellidomaterno, edad, posición, altura, peso, nacionalidad FROM usuario',
                    (err, respuesta) => {
                        if (err) reject(err);
                        resolve(respuesta);
                    });
            });
        };

        const obtenerPosicion = (idPosicion) => {
            return new Promise((resolve, reject) => {
                con.query('SELECT descripcion FROM posición WHERE id = ?', [idPosicion],
                    (err, respuesta) => {
                        if (err) reject(err);
                        resolve(respuesta[0]?.descripcion || 'Desconocida');
                    });
            });
        };

        const usuarios = await obtenerUsuarios();

        const posiciones = await Promise.all(
            usuarios.map(usuario => obtenerPosicion(usuario.posición))
        );

        const usuariosConPosicion = usuarios.map((usuario, index) => ({
            ...usuario,
            posicionNombre: posiciones[index]
        }));

        return res.status(200).send({
            message: 'ok',
            usuarios: usuariosConPosicion
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send({ message: "Error al obtener usuarios" });
    }
});
//******************************************************************************************************************* */
app.put('/obtenerUnUsuario', (req, res) => {
    let id = req.body.id;
    let solicitud = req.body.solicitud;

    if (!id || !solicitud) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if (isNaN(id) || !validarTexto(solicitud) || contieneEtiquetaHTML(solicitud)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    const columnasPermitidas = ["nombre", "apellidoPaterno", "apellidoMaterno", "edad", "posición", "altura", "peso", "nacionalidad"];
    if (!columnasPermitidas.includes(solicitud)) {
        return res.status(400).send({ message: "Parámetro no permitido" });
    }

    let query = `SELECT ${solicitud} FROM usuario WHERE id = ?`;

    con.query(query, [id], (err, respuesta) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }

        if (respuesta.length === 0) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }
        if (solicitud === "posición") {
            let idPosicion = respuesta[0].posición;

            con.query(`SELECT descripcion FROM posición WHERE id = ?`, [idPosicion], (err, respuestaPosicion) => {
                if (err) {
                    console.log("Error al conectar", err);
                    return res.status(500).send({ message: "Error al conectar" });
                }

                if (respuestaPosicion.length === 0) {
                    return res.status(404).send({ message: "Posición no encontrada" });
                }

                return res.status(200).send({ message: 'ok', usuario: respuestaPosicion[0].descripcion });
            });

        } else {
            return res.status(200).send({ message: 'ok', usuario: respuesta[0][solicitud] });
        }
    });
});
//******************************************************************************************************************* */
app.put('/editarUsuario', (req, res) => {
    let { id, solicitud, cambio } = req.body;

    if (!id || !solicitud || !cambio) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if (isNaN(id) || !validarTexto(solicitud) || contieneEtiquetaHTML(solicitud) || contieneEtiquetaHTML(cambio)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    const columnasPermitidas = ["nombre", "apellidoPaterno", "apellidoMaterno", "edad", "posición", "altura", "peso", "nacionalidad"];
    if (!columnasPermitidas.includes(solicitud)) {
        return res.status(400).send({ message: "Parámetro no permitido" });
    }

    if (["edad", "peso", "altura"].includes(solicitud)) {
        cambio = parseInt(cambio);
        if (isNaN(cambio)) {
            return res.status(400).send({ message: "El valor debe ser un número" });
        }
    } else if (!validarTexto(cambio) || contieneEtiquetaHTML(cambio)) {
        return res.status(400).send({ message: "El valor debe ser texto sin etiquetas HTML" });
    }
    const ejecutarUpdate = (nuevoValor) => {
        let query = `UPDATE usuario SET ${solicitud} = ? WHERE id = ?`;
        con.query(query, [nuevoValor, id], (error, response) => {
            if (error) {
                console.log("Error al conectar", error);
                return res.status(500).send({ message: "Error al actualizar el usuario" });
            }

            if (response.affectedRows === 0) {
                return res.status(404).send({ message: "No se encontró el usuario" });
            }

            return res.status(202).send({ message: 'ok', respuesta: `Usuario actualizado correctamente` });
        });
    };
    if (solicitud === "posición") {
        let posicion = cambio.toLowerCase();
        con.query(`SELECT id FROM posición WHERE descripcion = ?`, [posicion], (err, respuestaPosicion) => {
            if (err) {
                console.log("Error al conectar", err);
                return res.status(500).send({ message: "Error al conectar" });
            }
            if (respuestaPosicion.length === 0) {
                return res.status(404).send({ message: "Posición no encontrada" });
            }

            let idPosicion = respuestaPosicion[0].id;
            ejecutarUpdate(idPosicion);
        });

    } else {
        ejecutarUpdate(cambio);
    }
});
//******************************************************************************************************************* */
app.delete('/BorrarUnUsuario', (req, res) => {
    let id = req.body.id
    if (!id || isNaN(id)) {
        return res.status(400).send({ message: "Faltan parámetros o el id no es un número" });
    }
    con.query('DELETE usuario FROM usuario WHERE id =(?)', [id], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }
        console.log(respuesta)
        return res.status(202).send({ message: 'ok', respuesta: respuesta.affectedRows });
    });

})
//******************************************************************************************************************* */
app.delete('/BorrarUsuarios', (req, res) => {
    con.query('DELETE usuario FROM usuario;', (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }
        console.log(respuesta)
        return res.status(202).send({ message: 'ok', respuesta: respuesta.affectedRows });
    });

})
//******************************************************************************************************************* */
app.put('/login', (req, res) => {
    let { usuario, password } = req.body;
    console.log(usuario, password)
    if (!usuario || !password) {
        return res.status(400).send({ message: "Faltan parámetros" });
    }
    if (!validarContraseña(password) || !validarUsuario(usuario) || contieneEtiquetaHTML(usuario) || contieneEtiquetaHTML(password)) {
        return res.status(400).send({ message: "No intentes adulterar la solicitud" });
    }
    con.query('SELECT id FROM usuario WHERE usuario = ? AND contraseña = ?', [usuario, password], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({ message: "Error al conectar" });
        }
        if (respuesta.length === 0) {
            return res.status(404).send({ message: "Usuario no encontrado" });
        }
        const token = jsonwebtoken.sign({ user: usuario }, process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION })
        const cookieOption = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
            path: "/",
            httpOnly: true,
            sameSite: 'strict'
        }
        res.cookie("cookiesesion", token, cookieOption)
        return res.status(200).send({ message: 'ok', respuesta: respuesta[0].id, redireccion: "/" });
    });
})
//******************************************************************************************************************* */
app.get('/verificar', async (req, res) => {
    try {
        const token = req.cookies.cookiesesion;
        if (!token) {
            return res.status(401).json({ success: false, message: "No hay token" });
        }

        const decodificada = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        if (!decodificada.user) {
            return res.status(401).json({ success: false, message: "Token inválido" });
        }

        const [rows] = await con.promise().query(
            'SELECT id FROM usuario WHERE usuario = ?', 
            [decodificada.user]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Usuario no encontrado" });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error en verificación:', error);
        return res.status(401).json({ success: false, message: "Token inválido o expirado" });
    }
});
app.get('/verificar-sesion', async (req, res) => {
    try {        const token = req.cookies.cookiesesion;
        if (!token) {
            return res.json({ sesionActiva: false });
        }

        const decodificada = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        if (!decodificada.user) {
            return res.json({ sesionActiva: false });
        }

        const [rows] = await con.promise().query(
            'SELECT id FROM usuario WHERE usuario = ?', 
            [decodificada.user]
        );

        if (rows.length === 0) {
            return res.json({ sesionActiva: false });
        }

        return res.json({ sesionActiva: true });

    } catch (error) {
        console.error('Error en verificación de sesión:', error);
        return res.json({ sesionActiva: false });
    }
});

app.post('/cerrar-sesion', (req, res) => {
    res.clearCookie('cookiesesion', {
        path: "/"
    });
    return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
});

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000')
})