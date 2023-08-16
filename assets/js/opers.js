/* Este archivo contiene las operaciónes de los estadísticos. Se ha separado del archivo "utils.js" por motivos
de legibilidad */
const utils = require('./utils');
const moment = require('moment');
const config = require("./config");

/**
 * Método encargado de realizar los cálculos estadísticos de los contaminantes configurados en el archivo de configuración.
 * @param {Array} horarios 
 * @param {Array} diarios 
 * @param {Array} octohorarios 
 */
const calcEstad = (horarios, diarios, octohorarios) => {



    // va a almacenar todos los estadísticos. Es el objeto retornado por este método
    let arrEst = [];

    // Horarios-------------------------------------------------------------------------------------
    //verificamos si existen datos horarios por tratar
    if (horarios.length > 0) {


        horarios.forEach((contaminante, indexCont, arrCont) => {



            //Localizamos el contaminante en la lista de configuración y recuperamos su configuración de estadísticos
            let confEl = config.stdtcConf.find(elem => elem.key == contaminante.key)

            if (confEl) {


                // vemos si tiene calculos registrados para este tipo de datos. En este caso "horarios"
                let calc = confEl.calc.find(elCalc => elCalc.type == "horario");

                // si encuentra un cáculo a realizar
                if (calc) {

                    // creamos un objeto que va a contener todo el documento a imprimir especifico de este contaminante
                    let docu = {
                        title: `Estadistico_${contaminante.key}_H`,
                        data: []
                    }


                    // vamos a recuperar los titulos de las columnas del archivo de entrada
                    let colList = utils.joinColumns(contaminante.data);  // array de strings 
                    // eliminamos la fecha y hora de la lista
                    colList.shift();
                    colList.shift();

                    // recuperamos el año de los datos,fecha de inicio y final, numero de días y horas. Para eso usaremos un dato aleatorio por el medio del array
                    let fecha = contaminante.data[Math.round(contaminante.data.length / 2)].FECHA
                    let anio = fecha.split('-')[2];
                    let fechaIni = { string: `01-1-${anio}`, unix: moment(`1-1-${anio}`, "DD-MM-YYYY").valueOf() } // primer día de ese año
                    let fechaFin = { string: `31-12-${anio}`, unix: moment(`31-12-${anio}`, "DD-MM-YYYY").valueOf() } //último día de ese año
                    // ahora recuperaremos la cantidad de días y horas que tiene dependiendo si es bisiesto
                    let numDias = moment([anio]).isLeapYear() ? 366 : 365;
                    let numHoras = numDias * 24;

                    // Vamos a crear unos contadores por cada una de las estaciones. Esos contadores almacenan datos como el array ordenado libre de errores, cuantos errores hubieron, etc.
                    //creamos los contadores usando la lista de titulos de columnas
                    let contaEsta = [] // lista de contadores de cada Estación que hay en el contaminante
                    colList.forEach(col => {
                        contaEsta.push(
                            {
                                name: col,
                                nameVal: `${col} value`,
                                nameFlag: `${col} flag`,
                                errorCount: 0,
                                dataArr: [], // datos sin errores
                                sumaTotal: 0, // aquí iremos sumando todos los valores válidos. Cuando terminamos, dividimos ese número por el "length" de dataArr para conseguir la media anual. 
                                supera: new Array(calc.oper.superaciones.length).fill(0), // sumas de superaciónes diarias si sin datos diarios y horarias si son datos horarios. Cada posición del array es la suma de una superación.                            
                                porcenDaVal: 0, // porcentaje de datos válidos. Se calcula al final del bucle.
                                maxMedia: 0, // Maximo media . Se calcula al final de bucle. esto vale tanto para max media diaria como horaria.                            
                            }
                        )
                    });

                    // recorremos los datos y empezamos a almacenar datos en los contadores
                    //recorremos cada franja
                    contaminante.data.forEach((franja, indexF, arrF) => {

                        // recorremos los contadores para usar cada uno al que le corresponde por cada estación de la franja
                        contaEsta.forEach((contad, indexC, arrC) => {

                            let value = utils.stringToNumber(franja[contad.nameVal]);
                            let fechaFranja = moment(franja.FECHA, "DD-MM-YYYY").valueOf();

                            // debemos mirar si la franja se encuentra dentro del año que queremos incluir en los calculos
                            if (fechaIni.unix <= fechaFranja <= fechaFin.unix) {

                                //si el valor y la flag son válidas
                                if (value > -9999 && config.validFlags.includes(franja[contad.nameFlag])) {
                                    // guardamos el valor válido
                                    contad.dataArr.push(value);

                                    contad.maxMedia = value > contad.maxMedia ? value : contad.maxMedia;

                                    contad.sumaTotal += value;

                                    // miramos si tiene superaciones que vigilar
                                    if (calc.oper.superaciones) {

                                        // miramos si el valor supera las superaciones marcadas y si es así, actualizamos el contador de superaciones.
                                        calc.oper.superaciones.forEach((supe, indexS, arrS) => {

                                            if (value > supe) {
                                                contad.supera[indexS]++;
                                            }

                                        });
                                    }
                                } else { // si el dato no es valido
                                    contad.errorCount++;

                                }
                            }
                        })
                    })

                    // ahora añadimos los datos al documento dependiendo del archivo de configuración

                    if (calc.oper.maxMedia) {
                        let obj = { estadistico: "Maximo media horaria" }
                        contaEsta.forEach(estacion => {
                            obj[estacion.name] = `${utils.roundNumber(estacion.maxMedia, contaminante.key)}`.replace('.', ',');
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.mediaAnual) {
                        let obj = { estadistico: "Media anual" }
                        contaEsta.forEach(estacion => {
                            let division = estacion.sumaTotal / estacion.dataArr.length;
                            if (isNaN(division)) {// si NO es un numero
                                obj[estacion.name] = "SD" // SD = sin datos
                            } else {
                                obj[estacion.name] = `${utils.roundNumber(division, contaminante.key)}`.replace('.', ',');
                            }
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.numDAna) { // Numero de horas analizadas 
                        let obj = { estadistico: "Numero de dias analizados" }
                        colList.forEach(colTitl => {
                            obj[colTitl] = numDias;
                        });
                        docu.data.push(obj);
                    }


                    if (calc.oper.numHAna) { // Numero de Horas Analizadas
                        let obj = { estadistico: "Numero de horas analizadas" }
                        colList.forEach(colTitl => {
                            obj[colTitl] = numHoras;
                        });
                        docu.data.push(obj);
                    }


                    if (calc.oper.percentiles.length > 0) { // Posición y Percentil

                        calc.oper.percentiles.forEach(perc => {

                            let obj, obj2;
                            if (perc == 50) {
                                obj = { estadistico: `Posicion P${perc}` };
                                obj2 = { estadistico: `Mediana` };
                            } else {
                                obj = { estadistico: `Posicion P${perc}` };
                                obj2 = { estadistico: `Percentil ${perc}` };
                            }

                            contaEsta.forEach(estacion => {
                                //ordenamos los datos de forma ascendente
                                let dat1 = [...estacion.dataArr].sort((a, b) => a - b);
                                let posicion = Math.round((perc * dat1.length) / 100);
                                let percent = `${dat1[posicion-1]}`.replace('.', ',');
                                if (percent == "undefined") {
                                    posicion = "SD";
                                    percent = "SD";
                                }
                                obj[estacion.name] = posicion;
                                obj2[estacion.name] = percent;
                            })
                            docu.data.push(obj);
                            docu.data.push(obj2);
                        });
                    }


                    if (calc.oper.porcenDaVa) { // porcentaje de datos validos
                        let obj = { estadistico: "Porcentaje de datos validos horarios" }
                        contaEsta.forEach(estacion => {
                            let string = `${(Math.round(((estacion.dataArr.length * 100) / numHoras) * 100)) / 100}`.replace('.', ',');
                            obj[estacion.name] = `${string}%`;
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.superaciones) {
                        //creamos un array que va a contener cada uno de los "obj" que son superaciones.
                        let arrSupe = new Array(calc.oper.superaciones.length).fill(0);
                        //creamos cada uno de los titulos por cada superación
                        calc.oper.superaciones.forEach((superacion, indexSup) => {
                            arrSupe[indexSup] = { estadistico: `Superaciones horarias de ${superacion} ug/m3` }
                        });
                        contaEsta.forEach((estacion) => {
                            estacion.supera.forEach((sup, ind) => {
                                arrSupe[ind][estacion.name] = sup;
                            });
                        })
                        arrSupe.forEach(obj => {
                            docu.data.push(obj);
                        });
                    }

                    arrEst.push(docu);
                }

            }


        });
    }

    // Diarios------------------------------------------------------------------------------------------------
    if (diarios.length > 0) {

        diarios.forEach((contaminante, indexCont, arrCont) => {



            //Localizamos el contaminante en la lista de configuración y recuperamos su configuración de estadísticos
            let confEl = config.stdtcConf.find(elem => elem.key == contaminante.key)


            if (confEl) {

                // vemos si tiene calculos registrados para este tipo de datos. En este caso "horarios"
                let calc = confEl.calc.find(elCalc => elCalc.type == "diario");

                // si encuentra un cáculo a realizar
                if (calc) {

                    // creamos un objeto que va a contener todo el documento a imprimir especifico de este contaminante
                    let titulo = contaminante.key == "PM25" ? `Estadistico_PM2.5_D` : `Estadistico_${contaminante.key}_D`; // el PM25 es en realidad 2.5
                    let docu = {
                        title: titulo,
                        data: []
                    }


                    // vamos a recuperar los titulos de las columnas del archivo de entrada
                    let colList = utils.joinColumns(contaminante.data);  // array de strings 
                    // eliminamos la fecha y hora de la lista
                    colList.shift();
                    colList.shift();

                    // recuperamos el año de los datos,fecha de inicio y final, numero de días y horas. Para eso usaremos un dato aleatorio por el medio del array
                    let fecha = contaminante.data[Math.round(contaminante.data.length / 2)].FECHA
                    let anio = fecha.split('-')[2];
                    let fechaIni = { string: `01-1-${anio}`, unix: moment(`1-1-${anio}`, "DD-MM-YYYY").valueOf() } // primer día de ese año
                    let fechaFin = { string: `31-12-${anio}`, unix: moment(`31-12-${anio}`, "DD-MM-YYYY").valueOf() } //último día de ese año
                    // ahora recuperaremos la cantidad de días y horas que tiene dependiendo si es bisiesto
                    let numDias = moment([anio]).isLeapYear() ? 366 : 365;
                    let numHoras = numDias * 24;

                    // Vamos a crear unos contadores por cada una de las estaciones. Esos contadores almacenan datos como el array ordenado libre de errores, cuantos errores hubieron, etc.
                    //creamos los contadores usando la lista de titulos de columnas
                    let contaEsta = [] // lista de contadores de cada Estación que hay en el contaminante
                    colList.forEach(col => {
                        contaEsta.push(
                            {
                                name: col,
                                nameVal: `${col} value`,
                                nameFlag: `${col} flag`,
                                errorCount: 0,
                                dataArr: [], // datos sin errores
                                sumaTotal: 0, // aquí iremos sumando todos los valores válidos. Cuando terminamos, dividimos ese número por el "length" de dataArr para conseguir la media anual. 
                                supera: new Array(calc.oper.superaciones.length).fill(0), // sumas de superaciónes diarias si sin datos diarios y horarias si son datos horarios. Cada posición del array es la suma de una superación.                            
                                porcenDaVal: 0, // porcentaje de datos válidos. Se calcula al final del bucle.
                                maxMedia: 0, // Maximo media . Se calcula al final de bucle. esto vale tanto para max media diaria como horaria.                            
                            }
                        )
                    });

                    // recorremos los datos y empezamos a almacenar datos en los contadores
                    //recorremos cada franja
                    contaminante.data.forEach((franja, indexF, arrF) => {

                        // recorremos los contadores para usar cada uno al que le corresponde por cada estación de la franja
                        contaEsta.forEach((contad, indexC, arrC) => {

                            let value = utils.stringToNumber(franja[contad.nameVal]);
                            let fechaFranja = moment(franja.FECHA, "DD-MM-YYYY").valueOf();

                            // debemos mirar si la franja se encuentra dentro del año que queremos incluir en los calculos
                            if (fechaIni.unix <= fechaFranja <= fechaFin.unix) {

                                //si el valor y la flag son válidas
                                if (value > -9999 && config.validFlags.includes(franja[contad.nameFlag])) {
                                    // guardamos el valor válido
                                    contad.dataArr.push(value);

                                    contad.maxMedia = value > contad.maxMedia ? value : contad.maxMedia;

                                    contad.sumaTotal += value;

                                    // miramos si tiene superaciones que vigilar
                                    if (calc.oper.superaciones) {

                                        // miramos si el valor supera las superaciones marcadas y si es así, actualizamos el contador de superaciones.
                                        calc.oper.superaciones.forEach((supe, indexS, arrS) => {

                                            if (value > supe) {
                                                contad.supera[indexS]++;
                                            }

                                        });
                                    }
                                } else { // si el dato no es valido
                                    contad.errorCount++;

                                }
                            }
                        })
                    })


                    // ahora añadimos los datos al documento dependiendo del archivo de configuración

                    if (calc.oper.maxMedia) {
                        let obj = { estadistico: "Maximo media diaria" }
                        contaEsta.forEach(estacion => {
                            obj[estacion.name] = `${utils.roundNumber(estacion.maxMedia, contaminante.key)}`.replace('.', ',');
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.mediaAnual) {
                        let obj = { estadistico: "Media anual" }
                        contaEsta.forEach(estacion => {
                            let division = estacion.sumaTotal / estacion.dataArr.length;
                            if (isNaN(division)) {// si NO es un numero
                                obj[estacion.name] = "SD" // SD = sin datos
                            } else {
                                obj[estacion.name] = `${utils.roundNumber(division, contaminante.key)}`.replace('.', ',');
                            }
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.numDAna) { // Numero de horas analizadas 
                        let obj = { estadistico: "Numero de dias analizados" }
                        colList.forEach(colTitl => {
                            obj[colTitl] = numDias;
                        });
                        docu.data.push(obj);
                    }


                    if (calc.oper.numHAna) { // Numero de Horas Analizadas
                        let obj = { estadistico: "Numero de horas analizadas" }
                        colList.forEach(colTitl => {
                            obj[colTitl] = numHoras;
                        });
                        docu.data.push(obj);
                    }


                    if (calc.oper.percentiles.length > 0) { // Posición y Percentil

                        calc.oper.percentiles.forEach(perc => {

                            let obj, obj2;
                            if (perc == 50) {
                                obj = { estadistico: `Posicion P${perc}` };
                                obj2 = { estadistico: `Mediana` };
                            } else {
                                obj = { estadistico: `Posicion P${perc}` };
                                obj2 = { estadistico: `Percentil ${perc}` };
                            }

                            contaEsta.forEach(estacion => {
                                //ordenamos los datos de forma ascendente
                                let dat1 = [...estacion.dataArr].sort((a, b) => a - b);
                                let posicion = Math.round((perc * dat1.length) / 100);
                                let percent = `${dat1[posicion-1]}`.replace('.', ','); // se pone -1 porque en javascript se cuentan a partir de 0
                                if (percent == "undefined") {
                                    posicion = "SD";
                                    percent = "SD";
                                }
                                obj[estacion.name] = posicion;
                                obj2[estacion.name] = percent;
                            })
                            docu.data.push(obj);
                            docu.data.push(obj2);
                        });
                    }


                    if (calc.oper.porcenDaVa) { // porcentaje de datos validos
                        let obj = { estadistico: "Porcentaje de datos validos diarios" }
                        contaEsta.forEach(estacion => {
                            let string = `${(Math.round(((estacion.dataArr.length * 100) / numDias) * 100)) / 100}`.replace('.', ',');
                            obj[estacion.name] = `${string}%`;
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.superaciones) {
                        //creamos un array que va a contener cada uno de los "obj" que son superaciones.
                        let arrSupe = new Array(calc.oper.superaciones.length).fill(0);
                        //creamos cada uno de los titulos por cada superación
                        calc.oper.superaciones.forEach((superacion, indexSup) => {
                            arrSupe[indexSup] = { estadistico: `Superaciones diarias de ${superacion} ug/m3` }
                        });
                        contaEsta.forEach((estacion) => {
                            estacion.supera.forEach((sup, ind) => {
                                arrSupe[ind][estacion.name] = sup;
                            });
                        })
                        arrSupe.forEach(obj => {
                            docu.data.push(obj);
                        });
                    }

                    arrEst.push(docu);
                }

            }


        });


    }
    // octohorario--------------------------------------------------------------------------------------------
    // recordar que para calcular los datos octohorarios se usan los datos diarios.
    if (octohorarios.length > 0) {
        octohorarios.forEach((contaminante, indexCont, arrCont) => {


            //Localizamos el contaminante en la lista de configuración y recuperamos su configuración de estadísticos
            let confEl = config.stdtcConf.find(elem => elem.key == contaminante.key)


            if (confEl) {

                // vemos si tiene calculos registrados para este tipo de datos. En este caso "horarios"
                let calc = confEl.calc.find(elCalc => elCalc.type == "octohorario");

                // si encuentra un cáculo a realizar
                if (calc) {

                    // creamos un objeto que va a contener todo el documento a imprimir especifico de este contaminante
                    let docu = {
                        title: `Estadistico_${contaminante.key}_8H`,
                        data: []
                    }


                    // vamos a recuperar los titulos de las columnas del archivo de entrada
                    let colList = utils.joinColumns(contaminante.data);  // array de strings 
                    // eliminamos la fecha y hora de la lista
                    colList.shift();
                    colList.shift();

                    // recuperamos el año de los datos,fecha de inicio y final, numero de días y horas. Para eso usaremos un dato aleatorio por el medio del array
                    let fecha = contaminante.data[Math.round(contaminante.data.length / 2)].FECHA
                    let anio = fecha.split('-')[2];
                    let fechaIni = { string: `01-1-${anio}`, unix: moment(`1-1-${anio}`, "DD-MM-YYYY").valueOf() } // primer día de ese año
                    let fechaFin = { string: `31-12-${anio}`, unix: moment(`31-12-${anio}`, "DD-MM-YYYY").valueOf() } //último día de ese año
                    // ahora recuperaremos la cantidad de días y horas que tiene dependiendo si es bisiesto
                    let numDias = moment([anio]).isLeapYear() ? 366 : 365;
                    let numHoras = numDias * 24;

                    // Vamos a crear unos contadores por cada una de las estaciones. Esos contadores almacenan datos como el array ordenado libre de errores, cuantos errores hubieron, etc.
                    //creamos los contadores usando la lista de titulos de columnas
                    let contaEsta = [] // lista de contadores de cada Estación que hay en el contaminante
                    colList.forEach(col => {
                        contaEsta.push(
                            {
                                name: col,
                                nameVal: `${col} value`,
                                nameFlag: `${col} flag`,
                                errorCount: 0,
                                dataArr: [], // datos sin errores
                                sumaTotal: 0, // aquí iremos sumando todos los valores válidos. Cuando terminamos, dividimos ese número por el "length" de dataArr para conseguir la media anual. 
                                supera: new Array(calc.oper.superaciones.length).fill(0), // sumas de superaciónes diarias si sin datos diarios y horarias si son datos horarios. Cada posición del array es la suma de una superación.                            
                                porcenDaVal: 0, // porcentaje de datos válidos. Se calcula al final del bucle.
                                maxMedia: 0, // Maximo media . Se calcula al final de bucle. esto vale tanto para max media diaria como horaria.                            
                            }
                        )
                    });

                    // recorremos los datos y empezamos a almacenar datos en los contadores
                    //recorremos cada franja
                    contaminante.data.forEach((franja, indexF, arrF) => {

                        // recorremos los contadores para usar cada uno al que le corresponde por cada estación de la franja
                        contaEsta.forEach((contad, indexC, arrC) => {

                            let value = utils.stringToNumber(franja[contad.nameVal]);
                            let fechaFranja = moment(franja.FECHA, "DD-MM-YYYY").valueOf();

                            // debemos mirar si la franja se encuentra dentro del año que queremos incluir en los calculos
                            if (fechaIni.unix <= fechaFranja <= fechaFin.unix) {

                                //si el valor y la flag son válidas
                                if (value > -9999 && config.validFlags.includes(franja[contad.nameFlag])) {
                                    // guardamos el valor válido
                                    contad.dataArr.push(value);

                                    contad.maxMedia = value > contad.maxMedia ? value : contad.maxMedia;

                                    contad.sumaTotal += value;

                                    // miramos si tiene superaciones que vigilar
                                    if (calc.oper.superaciones) {

                                        // miramos si el valor supera las superaciones marcadas y si es así, actualizamos el contador de superaciones.
                                        calc.oper.superaciones.forEach((supe, indexS, arrS) => {

                                            if (value > supe) {
                                                contad.supera[indexS]++;
                                            }

                                        });
                                    }
                                } else { // si el dato no es valido
                                    contad.errorCount++;

                                }
                            }
                        })
                    })

                    // ahora añadimos los datos al documento dependiendo del archivo de configuración

                    if (calc.oper.maxMedia) {
                        let obj = { estadistico: "Maximo media 8horaria" }
                        contaEsta.forEach(estacion => {
                            obj[estacion.name] = `${utils.roundNumber(estacion.maxMedia, contaminante.key)}`.replace('.', ',');
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.mediaAnual) {
                        let obj = { estadistico: "Media anual" }
                        contaEsta.forEach(estacion => {
                            let division = estacion.sumaTotal / estacion.dataArr.length;
                            if (isNaN(division)) {// si NO es un numero
                                obj[estacion.name] = "SD" // SD = sin datos
                            } else {
                                obj[estacion.name] = `${utils.roundNumber(division, contaminante.key)}`.replace('.', ',');
                            }
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.numDAna) { // Numero de horas analizadas 
                        let obj = { estadistico: "Numero de 8Horarios analizados" }
                        colList.forEach(colTitl => {
                            obj[colTitl] = numDias;
                        });
                        docu.data.push(obj);
                    }


                    if (calc.oper.numHAna) { // Numero de Horas Analizadas
                        let obj = { estadistico: "Numero de 8horarios analizadas" }
                        colList.forEach(colTitl => {
                            obj[colTitl] = numHoras;
                        });
                        docu.data.push(obj);
                    }


                    if (calc.oper.percentiles.length > 0) { // Posición y Percentil

                        calc.oper.percentiles.forEach(perc => {

                            let obj, obj2;
                            if (perc == 50) {
                                obj = { estadistico: `Posicion P${perc}` };
                                obj2 = { estadistico: `Mediana` };
                            } else {
                                obj = { estadistico: `Posicion P${perc}` };
                                obj2 = { estadistico: `Percentil ${perc}` };
                            }

                            contaEsta.forEach(estacion => {
                                //ordenamos los datos de forma ascendente
                                let dat1 = [...estacion.dataArr].sort((a, b) => a - b);
                                let posicion = Math.round((perc * dat1.length) / 100);
                                let percent = `${dat1[posicion-1]}`.replace('.', ',');
                                if (percent == "undefined") {
                                    posicion = "SD";
                                    percent = "SD";
                                }
                                obj[estacion.name] = posicion;
                                obj2[estacion.name] = percent;
                            })
                            docu.data.push(obj);
                            docu.data.push(obj2);
                        });
                    }


                    if (calc.oper.porcenDaVa) { // porcentaje de datos validos
                        let obj = { estadistico: "Porcentaje de datos validos 8horarios" }
                        contaEsta.forEach(estacion => {
                            let string = `${(Math.round(((estacion.dataArr.length * 100) / numDias) * 100)) / 100}`.replace('.', ',');
                            obj[estacion.name] = `${string}%`;
                        })
                        docu.data.push(obj);
                    }


                    if (calc.oper.superaciones) {
                        //creamos un array que va a contener cada uno de los "obj" que son superaciones.
                        let arrSupe = new Array(calc.oper.superaciones.length).fill(0);
                        //creamos cada uno de los titulos por cada superación
                        calc.oper.superaciones.forEach((superacion, indexSup) => {
                            arrSupe[indexSup] = { estadistico: `Superaciones 8horarias de ${superacion} ug/m3` }
                        });
                        contaEsta.forEach((estacion) => {
                            estacion.supera.forEach((sup, ind) => {
                                arrSupe[ind][estacion.name] = sup;
                            });
                        })
                        arrSupe.forEach(obj => {
                            docu.data.push(obj);
                        });
                    }

                    arrEst.push(docu);
                }

            }



        });

    }

    return arrEst;

}






module.exports = {
    calcEstad
}