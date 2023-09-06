package canarias;

import java.util.HashMap;
import java.util.List;
import java.util.TreeMap;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

public class Main {
	Connection conn = null;
	Statement stmt = null;
	ResultSet rs = null;
	static String url = "jdbc:postgresql://172.23.255.110:5432/calidadaire-bd";
	static String username = "cegca";
	static String password = "cegca";
	static SimpleDateFormat sdf;

	public static void main(String[] args) {
		Calendar cal1 = Calendar.getInstance();
		Calendar cal2 = Calendar.getInstance();
		cal1.set(2023, 8, 5);
		cal2.set(2023, 8, 7);
		// Ejemplo entrada para el uso del programa
		calculateHourlyData(1, cal1.getTime(), cal2.getTime(), 1, false, 'T');
	}

	public static void calculateHourlyData(int stationId, Date startDate, Date endDate, int periodo, boolean calcStats,
			char type) {
		// Debemos recuperar de la BBDD los datos
		HashMap<Date, List<DataPoint>> estdata30 = new HashMap<Date, List<DataPoint>>();
		HashMap<Date, List<DataPoint>> estdata60 = new HashMap<Date, List<DataPoint>>();

		// Lógica de selección de datos según el tipo (V, T, X)
		HashMap<Date, List<DataPoint>> selectedData;
		if (type == 'V') {
			selectedData = fetchValidatedData(stationId, startDate, endDate, periodo); // Método para buscar datos
																						// validados
		} else if (type == 'T') {
			selectedData = fetchTempData(stationId, startDate, endDate, periodo); // Método para buscar datos temporales
		} else {
			selectedData = fetchBothTypesData(stationId, startDate, endDate, periodo); // Método para buscar ambos tipos
																						// de datos
		}

		// Calcular datos horarios
		for (Date date : selectedData.keySet()) {
			List<DataPoint> dataPoints = selectedData.get(date); // Obtener la lista de DataPoints para una fecha dada
			if (dataPoints != null && dataPoints.size() >= 1) { // Verificar si hay suficientes DataPoints para procesar

				// Ordenar la lista por 'periodo' si es necesario
				// Collections.sort(dataPoints, Comparator.comparing(DataPoint::getPeriodo));

				for (int j = 0; j < dataPoints.size(); j += 2) { // Saltar de dos en dos
					DataPoint dp1 = dataPoints.get(j);
					if (j < dataPoints.size() - 1) {
						if (dataPoints.get(j + 1).periodo % 2 == 0) {
							DataPoint dp2 = dataPoints.get(j + 1);
							if (dp1.ides == dp2.ides && dp1.cana == dp2.cana && dp1.ctec == dp2.ctec) {
								if (dp2.periodo % 2 == 0 && isValid(dp1) && isValid(dp2)) { // Se procesa solo si el
																							// segundo periodo es par

									double hourlyValue = (dp1.value + dp2.value) / 2;
									DataPoint datosHorarios = null;
									if (type == 'V') {

										datosHorarios = new DataPoint(hourlyValue, 11, (dp2.periodo / 2), dp2.ides,
												dp2.cana, dp2.ctec); // Flag V (11)

									} else if (type == 'T') {

										datosHorarios = new DataPoint(hourlyValue, 1, (dp2.periodo / 2), dp2.ides,
												dp2.cana, dp2.ctec); // Flag T (1)
									}

									// Añadir este DataPoint a la lista existente o crear una nueva lista y añadirlo
									List<DataPoint> existingList = estdata60.getOrDefault(date, new ArrayList<>());
									existingList.add(datosHorarios);
									estdata60.put(date, existingList);
								}
							} else {
								j -= 1; // Restamos una psoción en el indice, ya que no hay pareja de registro horario
							}
						} else {
							j -= 1;
						}
					}
				}
			}
		}
		// Prueba 2
		for (Date date : estdata60.keySet()) {
			List<DataPoint> dataPoints = estdata60.get(date);
			System.out.println("Fecha: " + date);

			for (DataPoint dp : dataPoints) {
				System.out.println("\tDataPoint: [Value = " + dp.value + ", Flag = " + dp.flag + ", Periodo = "
						+ dp.periodo + ", Ides = " + dp.ides + ", Cana = " + dp.cana + ", Ctec = " + dp.ctec + "]");
			}
		}

		// Fin Prueba 2

		// Insercción a la DB
		insertHourlyData(estdata60, type); // Insertar los datos en la base de datos

		// Calcular estadísticas si se solicita
		if (calcStats) {
			// Llamar a la función que calcula las estadísticas
			calculateStatistics(estdata60); // Método para calcular estadísticas
		}
	}

	// Verificar si un punto de datos es válido
	public static boolean isValid(DataPoint dp) {
		return dp.value != -9999 && (dp.flag == 11 || dp.flag == 12 || dp.flag == 13 || dp.flag == 1); // Añadimos 1
																										// para datos
																										// temporales
	}

// Métodos para buscar datos (a implementar)
	public static HashMap<Date, List<DataPoint>> fetchValidatedData(int stationId, Date startDate, Date endDate,
			int periodo) {
		HashMap<Date, List<DataPoint>> validatedData = new HashMap<>();
		Connection conn = null;
		Statement stmt = null;
		ResultSet rs = null;

		try {
			sdf = new SimpleDateFormat("yyyy-MM-dd");
			// Establecer la conexión
			conn = DriverManager.getConnection(url, username, password);

			// Crear una consulta SQL
			stmt = conn.createStatement();
			String query = "SELECT * FROM estdata30 WHERE ides = " + stationId + " AND fecha_d30 BETWEEN '"
					+ sdf.format(startDate) + "' AND '" + sdf.format(endDate)
					+ "' AND idflagv IN (11, 12, 13)  ORDER BY ides,fecha_d30, cana, ctec, periodo_d30;";
			// Prueba
			System.out.println(query);
			// Ejecutar la consulta
			rs = stmt.executeQuery(query);

			// Procesar el ResultSet
			while (rs.next()) {
				Date date = rs.getDate("fecha_d30"); // Fecha obtenida de tabla treintaminutal
				double value = rs.getDouble("val_d30");
				int flag = rs.getInt("idflagv");
				int numP = rs.getInt("periodo_d30");
				int ides = rs.getInt("ides");
				int cana = rs.getInt("cana");
				int ctec = rs.getInt("ctec");

				DataPoint dataPoint = new DataPoint(value, flag, numP, ides, cana, ctec);

				// Añadir a la lista de DataPoints para la fecha dada
				if (!validatedData.containsKey(date)) {
					validatedData.put(date, new ArrayList<>());
				}
				validatedData.get(date).add(dataPoint);
			}
			/**
			 * //Prueba debug for (Date date : validatedData.keySet()) { List<DataPoint>
			 * dataPoints = validatedData.get(date); System.out.println("Fecha: " + date);
			 * for (DataPoint dp : dataPoints) { System.out.println("DataPoint: " + dp + "
			 * Flag= " + dp.flag + " Valor= " + dp.value + " Periodo= " + dp.periodo + "
			 * Ides=" + dp.ides + "Cana= " + dp.cana + " Ctec>= " +dp.ctec); } }
			 * System.out.println("FIN"); //Fin prueba
			 */

		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			try {
				if (rs != null) {
					rs.close();
				}
				if (stmt != null) {
					stmt.close();
				}
				if (conn != null) {
					conn.close();
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		return validatedData;
	}

	public static HashMap<Date, List<DataPoint>> fetchTempData(int stationId, Date startDate, Date endDate,
			int periodo) {
		HashMap<Date, List<DataPoint>> validatedData = new HashMap<>();
		Connection conn = null;
		Statement stmt = null;
		ResultSet rs = null;

		try {
			sdf = new SimpleDateFormat("yyyy-MM-dd");
			// Establecer la conexión
			conn = DriverManager.getConnection(url, username, password);

			// Crear una consulta SQL
			stmt = conn.createStatement();
			String query = "SELECT * FROM estdata30 WHERE ides = " + stationId + " AND fecha_d30 BETWEEN '"
					+ sdf.format(startDate) + "' AND '" + sdf.format(endDate)
					+ "' AND idflagt IN (1)  ORDER BY ides,fecha_d30, cana, ctec, periodo_d30;";
			// Prueba
			System.out.println(query);
			// Ejecutar la consulta
			rs = stmt.executeQuery(query);

			// Procesar el ResultSet
			while (rs.next()) {
				Date date = rs.getDate("fecha_d30"); // Fecha obtenida de tabla treintaminutal
				double value = rs.getDouble("tmp_d30");
				int flag = rs.getInt("idflagt");
				int numP = rs.getInt("periodo_d30");
				int ides = rs.getInt("ides");
				int cana = rs.getInt("cana");
				int ctec = rs.getInt("ctec");

				DataPoint dataPoint = new DataPoint(value, flag, numP, ides, cana, ctec);

				// Añadir a la lista de DataPoints para la fecha dada
				if (!validatedData.containsKey(date)) {
					validatedData.put(date, new ArrayList<>());
				}
				validatedData.get(date).add(dataPoint);
			}
			/**
			 * //Prueba debug for (Date date : validatedData.keySet()) { List<DataPoint>
			 * dataPoints = validatedData.get(date); System.out.println("Fecha: " + date);
			 * for (DataPoint dp : dataPoints) { System.out.println("DataPoint: " + dp + "
			 * Flag= " + dp.flag + " Valor= " + dp.value + " Periodo= " + dp.periodo + "
			 * Ides=" + dp.ides + "Cana= " + dp.cana + " Ctec>= " +dp.ctec); } }
			 * System.out.println("FIN"); //Fin prueba
			 */

		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			try {
				if (rs != null) {
					rs.close();
				}
				if (stmt != null) {
					stmt.close();
				}
				if (conn != null) {
					conn.close();
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}

		return validatedData;
	}

	public static HashMap<Date, List<DataPoint>> fetchBothTypesData(int stationId, Date startDate, Date endDate,
			int periodo) {
		// Implementar lógica de base de datos
		return new HashMap<Date, List<DataPoint>>();
	}

	public static void insertHourlyData(HashMap<Date, List<DataPoint>> estdata60, char type) {
		Connection conn = null;
		PreparedStatement pstmt = null;

		try {
			// Conectar con la base de datos
			conn = DriverManager.getConnection(url, username, password);
			if (type == 'V') {
				// Preparar la consulta SQL
				String sql = "INSERT INTO estdata60 (ides, fecha_d60, val_D60, idflagv, periodo_d60, cana, ctec) VALUES (? ,? , ?, ?, ?, ?, ?);";
				pstmt = conn.prepareStatement(sql);

				// Recorrer cada entrada del HashMap y ordenarlo mediante TreeMap
				TreeMap<Date, List<DataPoint>> sortedEstData60 = new TreeMap<>(estdata60);
				for (HashMap.Entry<Date, List<DataPoint>> entry : sortedEstData60.entrySet()) {
					java.util.Date utilDate = entry.getKey();
					java.sql.Date sqlDate = new java.sql.Date(utilDate.getTime());
					List<DataPoint> dataPoints = entry.getValue();

					for (DataPoint dp : dataPoints) {
						pstmt.setInt(1, dp.ides);
						pstmt.setDate(2, sqlDate); // Usar setDate aquí
						pstmt.setDouble(3, dp.value);
						pstmt.setInt(4, dp.flag);
						pstmt.setInt(5, dp.periodo);
						pstmt.setInt(6, dp.cana);
						pstmt.setInt(7, dp.ctec);
						pstmt.addBatch();
					}
				}
			}
			if (type == 'T') {
				// Preparar la consulta SQL
				String sql = "INSERT INTO estdata60 (ides, fecha_d60, val_D60, idflagt, periodo_d60, cana, ctec) VALUES (? ,? , ?, ?, ?, ?, ?);";
				pstmt = conn.prepareStatement(sql);

				// Recorrer cada entrada del HashMap y ordenarlo mediante TreeMap
				TreeMap<Date, List<DataPoint>> sortedEstData60 = new TreeMap<>(estdata60);
				for (HashMap.Entry<Date, List<DataPoint>> entry : sortedEstData60.entrySet()) {
					java.util.Date utilDate = entry.getKey();
					java.sql.Date sqlDate = new java.sql.Date(utilDate.getTime());
					List<DataPoint> dataPoints = entry.getValue();

					for (DataPoint dp : dataPoints) {
						pstmt.setInt(1, dp.ides);
						pstmt.setDate(2, sqlDate); // Usar setDate aquí
						pstmt.setDouble(3, dp.value);
						pstmt.setInt(4, dp.flag);
						pstmt.setInt(5, dp.periodo);
						pstmt.setInt(6, dp.cana);
						pstmt.setInt(7, dp.ctec);
						pstmt.addBatch();
					}
				}
			}

			// Ejecutar el lote de inserciones
			pstmt.executeBatch();
			System.out.println("Insercción de Datos Exitosa");

		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			try {
				if (pstmt != null) {
					pstmt.close();
				}
				if (conn != null) {
					conn.close();
				}

			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

// Método hipotético para calcular estadísticas (a implementar)
	public static void calculateStatistics(HashMap<Date, List<DataPoint>> data) {
		// Implementar lógica de estadísticas
	}
}
