package canarias;

//Clase para almacenamiento datos
class DataPoint {
 public double value;
 public int flag;
 public int periodo;

 public DataPoint(double value, int flag, int periodo) {
     this.value = value;
     this.flag = flag;
     this.periodo = periodo;
 }

}