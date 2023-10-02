
let position = 0;
//const API_URL = `https://getyn.com.ar:2087/`
const API_URL = `http://localhost:2087/`

const socket = io(API_URL, {withCredentials: false,allowEIO3:true})

let numeroJugador = -1;
let bloquearJuego = false;


const conteoOverlay = document.querySelector('#conteo-overlay');
const conteo = document.querySelector('#conteo');

let infoJuego = {
    empezo: false,
    puedenmover: false
}

socket.on('actualizarjuego', (data) => infoJuego = data)

socket.on('contador', (segundos) => {
    document.querySelector('#contador').innerHTML = segundos;
})

socket.on('ganador', (data) => {
    if(data.user.id == numeroJugador) {
        bloquearJuego = true;
    }
    const chat = document.querySelector('#chat')
    if(chat) {
        chat.style.display = "flex"
        chat.innerHTML += `<div>${data.user.username} consiguió el puesto #${data.puesto} tardando 3s.</div>`;
    }
})

socket.on('movercaballo', (data) => {
    console.log("mover caballo")
    const micaballo = document.querySelector('#caballo-'+data.user)
    micaballo.style.left = `${data.position}%`;
})

socket.on('resetjuego', (data) => {
    for(let i = 0; i < data.cantidadCaballos; i++) {
        const spanNombre = document.querySelector('#jugador-'+i);
        if(spanNombre) {
            spanNombre.innerHTML = "-";
        }

        const caballo = document.querySelector('#caballo-'+i)
        if(caballo) {
            caballo.style.left = "0%";
        }
    
        const spanCaballo = document.querySelector(`#caballo-${i}-nombre`);
        if(spanCaballo) {
            spanCaballo.innerHTML = "-";
        }       
    }
    bloquearJuego = false;
    document.querySelector('#anotarse').style.display = "flex";
    infoJuego = data
})
socket.on('jugadoroff', (data) => {
    const spanNombre = document.querySelector('#jugador-'+data);
    if(spanNombre) {
        spanNombre.innerHTML = "-";
    }

    const spanCaballo = document.querySelector(`#caballo-${data}-nombre`);
    if(spanCaballo) {
        spanCaballo.innerHTML = "-";
    }
})

socket.on('conteo', (data) => {
    if(data != "off") {
        conteo.innerHTML = data;
        conteoOverlay.style.display = "flex";
        document.querySelector('#anotarse').style.display = "none";
    } else {
        conteoOverlay.style.display = "none";
    }
})

socket.on('nuevojugador', (data) => {

    const spanNombre = document.querySelector('#jugador-'+data.id);
    if(spanNombre) {
        spanNombre.innerHTML = data.username;
    }

    const spanCaballo = document.querySelector(`#caballo-${data.id}-nombre`);
    if(spanCaballo) {
        spanCaballo.innerHTML = data.username;
    }
    console.log(data)
})

document.addEventListener('keyup', (e) => {
    if(e.which == 39) {
        if(numeroJugador != -1 && bloquearJuego == false && infoJuego.puedenmover == true) {
            console.log("JUGADORNUMERO")
            console.log(numeroJugador)
            position += Math.random();
            socket.emit('movercaballo-client', {position, user: numeroJugador})
            /*const micaballo = document.querySelector('#caballo-'+numeroJugador)
            micaballo.style.left = `${position}%`;*/
        } else {
            console.log("no podes moverr")
        }
    }
})

const obtenerInfo = () => {
    console.log("obtener info")
    axios({
        url: `${API_URL}getInfo`,
        method:'GET'
    }).then(res => {
        const { code, data } = res.data
        if(code == 1) {
            
            console.log(data)
            for(let i = 0; i < data.jugadores.length; i++) {
                const spanNombre = document.querySelector('#jugador-'+data.jugadores[i].id);
                if(spanNombre) {
                    spanNombre.innerHTML = data.jugadores[i].username;
                }
            
                const spanCaballo = document.querySelector(`#caballo-${data.jugadores[i].id}-nombre`);
                if(spanCaballo) {
                    spanCaballo.innerHTML = data.jugadores[i].username;
                }

            }

            if(data.empezo == false) {
                document.querySelector('#anotarse').style.display = "flex";
            }
            infoJuego = data
        } else {
            console.log("OTRO CODIGO")
        }
    }).catch(err => {
        console.log("error")
        console.log(err)
    })
}

obtenerInfo();

const unirseJuego = () => {
    const user = document.querySelector('#nombreuser');
    if(!user) return 1;
    const userValue = user.value;
    if(userValue.length < 2) return alert("Ingresa un nombre valido...");

    axios({
        url: `${API_URL}unirse`,
        method: 'POST',
 
        data: {
            username: userValue,
            socketid: socket.id
        }
    }).then(res => {
        const { code, data } = res.data

        if(code == 1) {
            console.log(data)
            numeroJugador = data.id;
            document.querySelector('#anotarse').style.display = "none";
        } else if(code == 2) {
            alert("Sólo pueden jugar 3 a la vez.")
        }
    })
}