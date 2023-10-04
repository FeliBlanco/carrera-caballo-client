let position = 0;
const API_URL = `https://getyn.com.ar:2087/`
//const API_URL = `http://localhost:2087/`

let uniendose = false;

const socket = io(API_URL, {withCredentials: false, allowEIO3:true})

let numeroJugador = -1;
let bloquearJuego = false;


const conteoOverlay = document.querySelector('#conteo-overlay');
const conteo = document.querySelector('#conteo');

let infoJuego = {
    empezo: false,
    puedenmover: false
}

socket.on('resetcontador', (segundos) => { 
    sendChatMessage(`El juego se reinicia en ${segundos} segundo(s)...`);
})

socket.on('actualizarjuego', (data) => infoJuego = data)

socket.on('contador', (segundos) => {
    // ACTUALIZA EL TIEMPO DEL JUEGO
    document.querySelector('#contador').innerHTML = segundos;
})

socket.on('ganador', (data) => {
    // CUANDO UN JUGADOR LLEGA A LA META
    if(data.user.id == numeroJugador) {
        if(data.puesto == 1) {
            document.querySelector('.confetti').style.display = "block";
            render();
            initConfetti();
            setTimeout(() => {
                document.querySelector('.confetti').style.display = "none";
            }, 3000)
            document.querySelector('#s-festejo').play()
        }
        bloquearJuego = true;
    }
    sendChatMessage(`${data.user.username} consiguió el puesto #${data.puesto} tardando ${data.tiempo}.`)
})

socket.on('movercaballo', (data) => {
    // ACTUALIZA LA POSICION DEL CABALLO
    setPosCaballo(data.user, data.position);
})

socket.on('resetjuego', (data) => {
    for(let i = 0; i < data.cantidadCaballos; i++) {
        setPosCaballo(i, 0);
        darNombreCaballo(i, "-");
    }
    bloquearJuego = false;
    document.querySelector('#anotarse').style.display = "flex";
    infoJuego = data
    document.querySelector('#contador').innerHTML = "00:00"
    numeroJugador = -1
})

socket.on('jugadoroff', (data) => {
    darNombreCaballo(data, "-");
})

socket.on('conteo', (data) => {
    if(data != "off") {
        conteo.innerHTML = data;
        conteoOverlay.style.display = "flex";
        document.querySelector('#anotarse').style.display = "none";
    } else {
        conteoOverlay.style.display = "none";
        document.querySelector('#s-trompeta').play()
    }
})

socket.on('nuevojugador', (data) => {
    darNombreCaballo(data.id, data.username);
})

document.addEventListener('keyup', (e) => {
    if(e.which == 39) {
        if(numeroJugador != -1 && bloquearJuego == false && infoJuego.puedenmover == true) {
            position += Math.random();
            socket.emit('movercaballo-client', {position, user: numeroJugador})
            /*const micaballo = document.querySelector('#caballo-'+numeroJugador)
            micaballo.style.left = `${position}%`;*/
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
            for(let i = 0; i < data.jugadores.length; i++) {
                darNombreCaballo(data.jugadores[i].id, data.jugadores[i].username);
            }

            if(data.empezo == false) {
                document.querySelector('#anotarse').style.display = "flex";
            }
            infoJuego = data
        }
    }).catch(err => {
        console.log("error")
        console.log(err)
    })
}

obtenerInfo();

const unirseJuego = () => {
    if(uniendose) return;
    uniendose = true;

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
            numeroJugador = data.id;
            document.querySelector('#anotarse').style.display = "none";
        } else if(code == 2) {
            alert("Sólo pueden jugar 3 a la vez.");
        } else if(code == 3) {
            alert("Ya hay un jugador con ese nombre.");
        }
    }).finally(() => {
        uniendose = false;
    })
}


const darNombreCaballo = (caballo, nombre) => {
    const spanNombre = document.querySelector(`#jugador-${caballo}`);
    if(spanNombre) {
        spanNombre.innerHTML = nombre.length > 1 ? `${nombre} (${caballo + 1})` : nombre;
    }

    const spanCaballo = document.querySelector(`#caballo-${caballo}-nombre`);
    if(spanCaballo) {
        spanCaballo.innerHTML = nombre.length > 1 ? `${nombre} (${caballo + 1})` : nombre;
    }  
}

const setPosCaballo = (caballo, pos) => {
    const micaballo = document.querySelector(`#caballo-${caballo}`)
    if(micaballo) {
        micaballo.style.left = `${pos}%`;
    }
}

const sendChatMessage = (text) => {
    const chat = document.querySelector('#chat');
    if(chat) {
        chat.style.display = "flex"
        chat.innerHTML += `<div>${text}</div>`;

        chat.scrollTo(0, chat.scrollHeight);
    }
}