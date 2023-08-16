/**
 * listado de flags validas
 */
const validFlags =['V', 'O', 'R'];
/** Aqui tenemos la lista de los contaminantes que deben ser calculados a octohorario. */
const cont8hList = ["O3", "CO"]

/** lista de contaminantes que solo van a tener 1 decimal. Los demás tendrán 0 decimales. */
const oneDecimalList = ["CO", "BTX"]

/** Configuración para realizar las operaciónes estadísticas divididas por contaminantes*/
const stdtcConf = [

    {
        key: 'PM10',
        calc: [
            {
                type: "diario",
                oper: {
                    superaciones: [50], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,                   
                    maxMedia: true, // maximo media diaria/horaria/octohoraria,
                    numDAna: true, // numero de dias analizados
                    numHAna: false, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9, 99.73] // se usará para calcular también la posición
                }
            }
        ]
    },
    {
        key: 'PM25',
        calc: [
            {
                type: "diario",
                oper: {
                    superaciones: [25], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: true, // maximo media diaria/horaria/octohoraria
                    numDAna: true, // numero de dias analizados
                    numHAna: false, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9, 99.73] // se usará para calcular también la posición
                }
            }
        ]
    },
    {
        key: 'CO',
        calc: [
            {
                type: "octohorario",
                oper: {
                    superaciones: [200], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: false, // maximo media diaria/horaria/octohoraria
                    numDAna: true, // numero de dias analizados
                    numHAna: false, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9] // se usará para calcular también la posición
                }
            }
        ]
    },
    {
        key: 'NO2',
        calc: [
            {
                type: "horario",
                oper: {
                    
                    superaciones: [200], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: false, // maximo media diaria/horaria/octohoraria 
                    numDAna: false, // numero de dias analizados 
                    numHAna: true, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9] // se usará para calcular también la posición
                }
            }
        ]
    },
    {
        key: 'O3',
        calc: [
            {
                type: "octohorario",
                oper: {
                    superaciones: [120, 100], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: true, // maximo media diaria/horaria/octohoraria
                    numDAna: true, // numero de dias analizados
                    numHAna: false, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95] // se usará para calcular también la posición
                }
            },
            {
                type: "horario",
                oper: {
                    
                    superaciones: [240, 180], //ug/m3
                    mediaAnual: false,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: true, // maximo media diaria/horaria/octohoraria
                    numDAna: false, // numero de dias analizados
                    numHAna: true, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95] // se usará para calcular también la posición
                }
            }
        ]

    },
    {
        key: 'SO2',
        calc: [
            {
                type: "diario",
                oper: {
                    superaciones: [125], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: true, // maximo media diaria/horaria/octohoraria
                    numDAna: true, // numero de dias analizados
                    numHAna: false, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9, 99.73] // se usará para calcular también la posición
                }
            },
            {
                type: "horario",
                oper: {
                    
                    superaciones: [350], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: true, // maximo media diaria/horaria/octohoraria
                    numDAna: false, // numero de dias analizados
                    numHAna: true, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9, 99.73] // se usará para calcular también la posición
                }
            }
        ]
    },
    {
        key: 'BEN',
        calc: [
            {
                type: "diario",
                oper: {
                    superaciones: [5], //ug/m3
                    mediaAnual: true,
                    porcenDaVa: true, // porcentaje de datos validos diarios/horarios/octohorarios,
                    maxMedia: false, // maximo media diaria/horaria/octohoraria
                    numDAna: true, // numero de dias analizados
                    numHAna: false, //numero de horas analizados
                    percentiles: [50, 98, 99.79, 25, 75, 95, 99.9] // se usará para calcular también la posición
                }
            }
        ]
    }

]



module.exports = {
    validFlags,
    cont8hList,
    oneDecimalList,
    stdtcConf

}