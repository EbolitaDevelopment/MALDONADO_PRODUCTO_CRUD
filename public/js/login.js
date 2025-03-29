document.getElementById("loginForm").addEventListener("submit", async(event)=>{
    event.preventDefault();
    let response = await fetch("/login", {
        method: "PUT",
        body: JSON.stringify({
            usuario: event.target.usuario.value,
            password: event.target.password.value
        }),
        headers: {
            "Content-Type": "application/json"
        }
})
let nuevoUsuario= document.getElementById("nuevoUsuario");
let responseJson = await response.json();
if(responseJson.message == "ok"){
    alert("Inicio de sesión exitoso");
    document.getElementById("nuevoUsuario").innerHTML = `Aspirante con id ${responseJson.respuesta} inicio sesión correctamente`;
    window.location.href = "/";
}else{
    alert("Error al iniciar Sesión");
    nuevoUsuario.innerHTML = "La servidor tuvo problemas para el inicio de sesión: "+responseJson.message;
}
});