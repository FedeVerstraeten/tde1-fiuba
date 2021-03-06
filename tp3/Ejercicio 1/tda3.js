//TODO: para dinámico, atacar con las M torretas los M primeros mínimos de VidaBarcoi - Grilla[i][j]

var NUM_COLUMNAS = 100; //Numero de columnas

var NUM_BARCOS = 10; //Numero de barcos en el juego (numero de procesos)
var NUM_TURRETS = 10; //Numero de torretas en el juego (numero de procesadores)

var GRID_DAMAGE_MAX = 1000; //Maximo daño en la grilla para grilla uniforme
var GRID_DAMAGE_MIN = 1; //Minimo daño en la grilla para grilla uniforme

var LIFE_MIN = 20;
var LIFE_MAX = 200;

var grid; //grilla 2d de daños
var ships; //vector de barcos
var turrets; //vector de turrets

var p = 0; //la cantidad de puntos que recibe el jugador B
var numturnos = 0; //la cantidad de turnos

//crea los arrays de grilla, barcos y torretas.
function Init() {
    p = 0;
    Grid_Initialize();
    Ships_Initialize();
    Turrets_Initialize();
    Grid_InitializeWithUniformDistribution();
    console.log(grid);
}

//inicializa la grilla.
function Grid_Initialize() {
    grid = new Array(NUM_BARCOS);
    for (var i = 0; i < NUM_BARCOS; i++) {
        grid[i] = new Array(NUM_COLUMNAS);
    }
}

//inicializa la grilla de daños con ceros.
function Grid_InitializeWithZerores() {
    for (var i = 0; i < NUM_BARCOS; i++) {
        for (var j = 0; j < NUM_COLUMNAS; j++) {
            grid[i][j] = 0;
        }
    }
}

//inicializa la grilla de daños con una distribución uniforme.
function Grid_InitializeWithUniformDistribution() {
    for (var i = 0; i < NUM_BARCOS; i++) {
        for (var j = 0; j < NUM_COLUMNAS; j++) {
            grid[i][j] = RandomBetween(GRID_DAMAGE_MIN, GRID_DAMAGE_MAX);
        }
    }
}

function RandomBetween(min, max) {
    return Math.floor(Math.random() * max) + min;
}



//inicializa el array de barcos
function Ships_Initialize() {
    ships = new Array(NUM_BARCOS);
    var randomLife = RandomBetween(LIFE_MIN, LIFE_MAX);
    //cargamos los barcos, con una distribución uniforme de vida.
    for (var i = 0; i < NUM_BARCOS; i++) {
        ships[i] = {};
        ships[i].ID = i;
        ships[i].row = i;
        ships[i].column = 0;
        ships[i].isDead = false;
        ships[i].life = randomLife;
        ships[i].prevlife = randomLife;
    }
}

//devuelve true sii existe algún barco que todavía está vivo
function Ships_ThereExistsOneNotDead() {
    for (var i = 0; i < NUM_BARCOS; i++) {
        if (!ships[i].isDead) return true;
    }
    return false;
}

//avanza todos los barcos _vivos_ a la derecha, independientemente de en qué columna están
function Ships_AdvanceToTheRight() {
    for (var i = 0; i < NUM_BARCOS; i++) {
        if (!ships[i].isDead) {
            ships[i].column++;
            ships[i].prevlife = ships[i].life
            if (ships[i].column == NUM_COLUMNAS) {
                ships[i].column = 0; //la grilla es virtualmente infinita; si me pasé, me teletransporto al comienzo.
            }

            p++; //sumo puntos a la variable global p
        }
    }
}


//inicializa el array de torretas ("procesadores")
function Turrets_Initialize() {
    turrets = new Array(NUM_TURRETS);

    for (var i = 0; i < NUM_TURRETS; i++) {
        turrets[i] = {};
        turrets[i].ID = i;
    }
}

//dispara una torreta a una fila (siempre habrá uno y solo un barco en esa fila)
function Turret_ShootToRow(row) {
    var column = ships[row].column; //obtengo la columna en la cual se encuentra el barco
    ships[row].prevlife = ships[row].life; //guardo la vida actual del barco como previa al disparo del la torreta
    ships[row].life = ships[row].life - grid[row][column]; //resto a la vida del barco el daño de la grilla de daños

    if (ships[row].life <= 0) {
        ships[row].isDead = true;
    }
}

//dispara a un barco con todas las torretas a la vez
function Turret_ShootToRowWithAllTurrets(row) {
    for (var i = 0; i < NUM_TURRETS; i++) {
        Turret_ShootToRow(row);
    }
}

//para cada barco vivo, calculo en esta posición el número máximo de avances posibles disparándole con una torreta en esa fila.
function Player_RecalculateGreedy() {
    for (var i = 0; i < NUM_BARCOS; i++) {
        if (!ships[i].isDead) {
            var maxadvances = 0;
            var s = 0;
            var column = ships[i].column;
            var startcolumn = column;
            while (s < ships[i].life) {
                s = s + grid[i][column];
                column++;
                maxadvances++;
                //console.log('s', s);
                //console.log('column', column);
                //console.log('maxadvances', maxadvances);

                if (column == NUM_COLUMNAS) {
                    column = 0;
                }
            }
            ships[i].maxadvances = maxadvances;
        }
    }
}

//esta función me devuelve el ID del barco (ie. el número de fila) que tengo que atacar, siguiendo la estrategia Greedy.
function Player_GetRowNumberToAttackGreedy() {

    Player_RecalculateGreedy();

    var min_maxadvances = 1000000;
    var min_i = -1; //el ID del barco que atacaremos con la torreta.

    for (var i = 0; i < NUM_BARCOS; i++) {
        if (!ships[i].isDead) {
            if (ships[i].maxadvances < min_maxadvances) {
                min_maxadvances = ships[i].maxadvances;
                min_i = i;
            }
        }
    }
    return min_i;
}

//juega de a un turno siguiendo la estrategia Greedy:
function Player_PlayOneTurnGreedy() {

    //avanzo los barcos:
    Ships_AdvanceToTheRight();
    console.log("+ Avanzan los barcos hacia la derecha!");

    //obtengo la estrategia:
    var rowtoattack = Player_GetRowNumberToAttackGreedy();
    console.log("+ Greedy me sugiere que ataque la fila ", rowtoattack);

    Turret_ShootToRowWithAllTurrets(rowtoattack);
    console.log("+ Disparamos a la fila ", rowtoattack);

    //console.log("Los barcos quedan asi:");
    //console.log(JSON.stringify(ships));
}

//cuenta los barcos vivos:
function Ships_CountAliveShips() {
    var c = 0;
    for (var i = 0; i < NUM_BARCOS; i++) {
        if (!ships[i].isDead) c++;
    }
    return c;
}

//juega siguiendo la estrategia Greedy hasta que ya no queden más barcos vivos:
//Idea Estrategia Greedy: para cada barco, obtengo en qué columna está. Calculo ahora la siguiente métrica:
//cuento la cantidad de posiciones que el barco podría avanzar a la derecha si lo atacara con todas las torretas a la vez.
//Llamemos a ése número maxadvances. Luego, ataco al barco vivo que minimiza maxadvances, con todas las torretas a la vez.
//Esto es equivalente a pensar los barcos como procesos, y las torretas como procesadores, teniendo los procesos 
//de que pueden ser atacados con todos los procesadores a la vez. Busco sacarme de encima los procesos que tienen menor lifespan.
function Player_PlayGreedy() {
    Board_Cleanup();
    Board_Draw(numturnos);

    numturnos = 0;
    p = 0;
    while (Ships_ThereExistsOneNotDead()) {
        console.log("existe un barco todavía vivo");
        numturnos++;
        console.log('numturnos', numturnos);
        Player_PlayOneTurnGreedy();
        Board_Draw(numturnos);

        var numbarcosvivos = Ships_CountAliveShips();
        console.log('---------------------');
        console.log("Barcos: ", JSON.stringify(ships));
        console.log("Barcos vivos: ", numbarcosvivos);
        console.log("Puntos: ", p);

    }
    console.log('---------------------');
    console.log("El juego terminó. El jugador B obtuvo: ", p, " puntos");
    console.log("Numero de turnos totales: ", numturnos);
    console.log("Total de puntos totales: ", p);
}



////////////////////////////////////////////////////////////////////////////////////////


//juega siguiendo la estrategia Dinámica, hasta que ya no queden barcos vivos.
//Idea Estrategia Dinámica: para cada barco obtengo en qué columna está. Sea N=NUM_TURRETS. Obtengo los N primeros máximos
//de la función grid[i][columna], donde columna es la columna donde está el i-esimo barco, e i es un índice que recorre los barcos vivos.
//Ataco entonces con las N torretas dichos N primeros máximos, aprovechando entonces la no uniformidad de la grilla de daños
function Player_PlayDynamic() {
    Board_Cleanup();
    Board_Draw(numturnos);

    numturnos = 0;
    p = 0;
    while (Ships_ThereExistsOneNotDead()) {
        console.log("existe un barco todavía vivo");
        numturnos++;
        console.log('numturnos', numturnos);
        Player_PlayOneTurnDynamic();
        Board_Draw(numturnos);

        var numbarcosvivos = Ships_CountAliveShips();
        console.log('---------------------');
        console.log("Barcos: ", JSON.stringify(ships));
        console.log("Barcos vivos: ", numbarcosvivos);
        console.log("Puntos: ", p);

    }
    console.log('---------------------');
    console.log("El juego terminó. El jugador B obtuvo: ", p, " puntos");
    console.log("Numero de turnos totales: ", numturnos);
    console.log("Total de puntos totales: ", p);
}



function Player_PlayOneTurnDynamic() {
    Ships_AdvanceToTheRight();
    console.log("+ Avanzan los barcos hacia la derecha!");

    var turretsavailable = NUM_TURRETS;
    for (var i = 0; i < NUM_BARCOS; i++) {
        if (!ships[i].isDead) {
            var column = ships[i].column;
            for (var k = GRID_DAMAGE_MAX; k >= 0; k--) {
                if (grid[i][column] == k) {
                    //atacar!
                    ships[i].prevlife = ships[i].life;
                    ships[i].life = ships[i].life - grid[i][column];
                    turretsavailable--;
                    if (ships[i].life <= 0) {
                        ships[i].isDead = true;
                    }

                    if (turretsavailable == 0) return;

                }
            }
        }
    }

}




////////////////////////////////////////////////////////////////////////////////////////



//parsea las definiciones obtenidas en definitions
function ParseDefinitions() {
    var definitions = $('.definitions').val().trim();

    if (definitions == '') {
        alert('Por favor, pegue un texto valido en la grilla de definiciones');
        return false;
    }

    var defs = definitions.split(/\r?\n/);
    console.log(defs);

    //obtenemos el número de barcos y columnas
    for (var i = 0; i < defs.length; i++) {
        var res = defs[i].split(" ");
        NUM_COLUMNAS = res.length - 1;
    }
    NUM_BARCOS = i;

    //creamos el array de la grilla y los barcos:
    Init();

    //llenamos la grilla y los barcos con sus respectivos valores de daños y vida.
    for (var i = 0; i < defs.length; i++) {
        var res = defs[i].split(" ");
        ships[i].life = parseInt(res[0]);
        ships[i].prevlife = parseInt(res[0]);
        ships[i].isDead = (ships[i].life <= 0);
        ships[i].column = 0; //cada barco comienza de la columna cero.
        ships[i].maxadvances = null;
        for (var j = 1; j < res.length; j++) {
            grid[i][j - 1] = parseInt(res[j]);
        }
    }

    console.log('La grilla de danos queda asi:');
    console.log(grid);

    console.log('Los barcos quedan asi:');
    console.log(ships);

    var numturrets = parseInt($('.numTurrets').val());
    NUM_TURRETS = numturrets;

    return true;
}

////////////////////////////////////////////////////////////////////////////////////////

//funciones de representación gráfica:
function Board_Cleanup() {
    p = 0;
    numturnos = 0;
    $('#svgOne').find('*').remove();
}

function Board_Draw(turn) {
    var LADO_CUADRADITO = 20;

    var WIDTH_BOARD = NUM_COLUMNAS * LADO_CUADRADITO + 20;
    var POS_THISBOARD = turn * WIDTH_BOARD;

    console.log('WIDTH_BOARD', WIDTH_BOARD);
    console.log('POS_THISBOARD', POS_THISBOARD);

    var svgns = "http://www.w3.org/2000/svg";

    //dibujamos el board a tiempo t
    for (var i = 0; i < NUM_COLUMNAS; i++) {
        for (var j = 0; j < NUM_BARCOS; j++) {

            var x = POS_THISBOARD + i * LADO_CUADRADITO;
            var y = j * LADO_CUADRADITO;

            var colorgrid = grid[j][i] * 20;

            var rect = document.createElementNS(svgns, 'rect');
            rect.setAttributeNS(null, 'x', x);
            rect.setAttributeNS(null, 'y', y);
            rect.setAttributeNS(null, 'height', LADO_CUADRADITO);
            rect.setAttributeNS(null, 'width', LADO_CUADRADITO);
            rect.setAttribute("stroke", "black");
            rect.setAttribute("stroke-width", "2");
            rect.setAttributeNS(null, 'fill', 'rgb(' + colorgrid.toString() + ', ' + colorgrid.toString() + ', ' + colorgrid.toString() + ')');
            document.getElementById('svgOne').appendChild(rect);
        }

    }

    //Agrego indicacion numero de turno   
    var txt = document.createElementNS(svgns, 'text');
    var txtX = POS_THISBOARD + ((NUM_COLUMNAS-1)*LADO_CUADRADITO)/2;
    var txtY = (NUM_BARCOS+1) * LADO_CUADRADITO;

    txt.setAttributeNS(null, 'x', txtX);
    txt.setAttributeNS(null, 'y', txtY);
    txt.setAttributeNS(null,'font-size','15');
    txt.setAttributeNS(null,'font-weight','bold');
    txt.innerHTML = "Turno " + turn.toString();
    document.getElementById('svgOne').appendChild(txt);

    //dibujamos los barcos:
    for (var j = 0; j < NUM_BARCOS; j++) {
        var x = POS_THISBOARD + ships[j].column * LADO_CUADRADITO + 7;
        var y = j * LADO_CUADRADITO + 7;

        var colorship = ships[j].life * 5 + 30;

        var rect = document.createElementNS(svgns, 'rect');
        rect.setAttributeNS(null, 'x', x);
        rect.setAttributeNS(null, 'y', y);
        rect.setAttributeNS(null, 'height', LADO_CUADRADITO / 3);
        rect.setAttributeNS(null, 'width', LADO_CUADRADITO / 3);
        
        // AMARILLO: barco disparado
        if (ships[j].life < ships[j].prevlife && !ships[j].isDead) {
            rect.setAttributeNS(null, 'fill', 'rgb(255,255,0)');
        } 
        // VERDE: barco vivo
        else if (ships[j].life > 0 && !ships[j].isDead) {
            rect.setAttributeNS(null, 'fill', 'rgb(0,' + colorship.toString() + ',0)'); 
        }
        // ROJO: barco muerto
        else {
            rect.setAttributeNS(null, 'fill', 'rgb(255,0,0)');
        }
        
        document.getElementById('svgOne').appendChild(rect);


    }

    /*
    //dibuja el estado actual de los ships, grid, vida de cada barco, barcos muertos, y ataque actual de torretas.
    for (var i = 0; i < 100; i++) {
        var x = Math.random() * 5000,
            y = Math.random() * 3000;

        var rect = document.createElementNS(svgns, 'rect');
        rect.setAttributeNS(null, 'x', x);
        rect.setAttributeNS(null, 'y', y);
        rect.setAttributeNS(null, 'height', '50');
        rect.setAttributeNS(null, 'width', '50');
        rect.setAttributeNS(null, 'fill', '#' + Math.round(0xffffff * Math.random()).toString(16));
        document.getElementById('svgOne').appendChild(rect);
    }
    */
}



////////////////////////////////////////////////////////////////////////////////////////

function Start() {
    $('.btnPlayGreedy').click(function() {
        var ok = ParseDefinitions(); //si pudo parsear correctamente las definiciones, comienza Greedy
        if (ok) Player_PlayGreedy();
    });

    $('.btnPlayDynamic').click(function() {
        var ok = ParseDefinitions(); //si pudo parsear correctamente las definiciones, comienza Dynamic
        if (ok) Player_PlayDynamic();
    });
}

setTimeout("Start();", 100);