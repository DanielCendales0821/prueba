import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Observable, from, of, forkJoin } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
const STORAGE_REQ_KEY = 'storedreq';
interface StoredRequest {
  url: string;
  type: string;
  data: any;
  time: number;
  id: string;
}
@Injectable({
  providedIn: 'root'
})
export class OfflineManagerService {
  constructor(private storage: Storage, private http: HttpClient, private toastController: ToastController) { }
  public checkForEvents(): Observable<any> {
    return from(this.storage.get(STORAGE_REQ_KEY)).pipe(
      switchMap(storedOperations => {
        const storedObj = JSON.parse(storedOperations);
        if (storedObj && storedObj.length > 0) {
          return this.sendRequests(storedObj).pipe(
            finalize(() => {
              const toast = this.toastController.create({
                message: `Local data succesfully synced to API!`,
                duration: 3000,
                position: 'bottom'
              });
              toast.then(toastt => toastt.present());
              this.storage.remove(STORAGE_REQ_KEY);
            })
          );
        } else {
          console.log('no local events to sync');
          return of(false);
        }
      })
    );
  }

  /**
   * @param url = url del backend ejemplo "https://localhost/api/guardar/"
   * @param type= tipo de peticion "POST,GET,PUT,DELETE"
   * @param data = datos capturados
   * esta funcion recibe estos parametros en caso de que no haya internet y guarda los datos mencionados
   */
  public storeRequest(url, type, data) {
    const toast = this.toastController.create({
      message: `Your data is stored locally because you seem to be offline.`,
      duration: 3000,
      position: 'bottom'
    });
    toast.then(toastt => toastt.present());
    const action: StoredRequest = {
      url: String = url,
      type: String = type,
      data: String = data ,
      time: new Date().getTime(),
      id: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
    };
    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    return this.storage.get(STORAGE_REQ_KEY).then(storedOperations => {
      let storedObj = JSON.parse(storedOperations);
      if (storedObj) {
        storedObj.push(action);
      } else {
        storedObj = [action];
      }
      // Save old & new local transactions back to Storage
      return this.storage.set(STORAGE_REQ_KEY, JSON.stringify(storedObj));
    });
  }

  /**
   * @param operations
   * esta funcion esta encargada de leer
   * lo que este en el servicio de localstorage y empieza a enviar peticion una a una
   * op.type = post,put,get,delete
   * op.url = direccion backend o api
   * op.data datos capturados
   */
  public sendRequests(operations: StoredRequest[]) {
    const obs = [];
    for (const op of operations) {
      console.log('Make one request: ', op);
      const oneObs = this.http.request(op.type, op.url, op.data);
      obs.push(oneObs);
    }
    // Send out all local events and return once they are finished
    return forkJoin(obs);
  }
}
