package canarias;

//Clase para almacenamiento datos
class DataPoint {
 public double value;
 public int flag;
 public int periodo;
 public int ides;
 public int cana;
 public int ctec;

 public DataPoint(double value, int flag, int periodo, int ides, int cana, int ctec) {
     this.value = value;
     this.flag = flag;
     this.periodo = periodo;
     this.ides = ides;
     this.cana = cana;
     this.ctec = ctec;
 }

}