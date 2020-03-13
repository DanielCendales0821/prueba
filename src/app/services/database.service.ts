import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { HttpClient } from '@angular/common/http';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';
export interface Dev {
  id: number;
  name: string;
  skills: any[];
  img: string;
}
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private database: SQLiteObject;
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  developers = new BehaviorSubject([]);
  products = new BehaviorSubject([]);
  constructor(
    private plt: Platform,
    private sqlitePorter: SQLitePorter,
    private sqlite: SQLite,
    private http: HttpClient
  ) {
    this.plt.ready().then(() => {
      this.sqlite.create({
        name: 'developers.db',
        location: 'default'
      })
        .then((db: SQLiteObject) => {
          this.database = db;
          this.seedDatabase();
        });
    });
  }

  public seedDatabase() {
    this.http.get('assets/seed.sql', { responseType: 'text' })
      .subscribe(sql => {
        this.sqlitePorter.importSqlToDb(this.database, sql)
          .then(_ => {
            this.loadDevelopers();
            this.loadProducts();
            this.dbReady.next(true);
          })
          .catch(e => console.error(e));
      });
  }

  public getDatabaseState() {
    return this.dbReady.asObservable();
  }

  public getDevs(): Observable<Dev[]> {
    return this.developers.asObservable();
  }

  public getProducts(): Observable<any[]> {
    return this.products.asObservable();
  }
  public loadDevelopers() {
    return this.database.executeSql('SELECT * FROM developer', []).then(data => {
      const developers: Dev[] = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          let skills = [];
          if (data.rows.item(i).skills !== '') {
            skills = JSON.parse(data.rows.item(i).skills);
          }
          developers.push({
            id: data.rows.item(i).id,
            name: data.rows.item(i).name,
            skills: skills[i],
            img: data.rows.item(i).img
           });
        }
      }
      this.developers.next(developers);
    });
  }
  public addDeveloper(name, skills, img) {
    console.log( 'name', name, 'skills', skills, 'imagen', img);
    const data = [name, skills, img];
    console.log(data);
    return this.database.executeSql('INSERT INTO developer (name, skills, img) VALUES (?, ?, ?)', data).then(res => {
      this.loadDevelopers();
      console.log(res);
    });
  }

  public getDeveloper(id): Promise<Dev> {
    return this.database.executeSql('SELECT * FROM developer WHERE id = ?', [id]).then(data => {
      let skills = [];
      if (data.rows.item(0).skills !== '') {
        skills = JSON.parse(data.rows.item(0).skills);
      }
      return {
        id: data.rows.item(0).id,
        name: data.rows.item(0).name,
        skills: skills[0],
        img: data.rows.item(0).img
      };
    });
  }
  public deleteDeveloper(id) {
    return this.database.executeSql('DELETE FROM developer WHERE id = ?', [id]).then(_ => {
      this.loadDevelopers();
      this.loadProducts();
    });
  }
  public updateDeveloper(dev: Dev) {
    const data = [dev.name, JSON.stringify(dev.skills), dev.img];
    return this.database.executeSql(`UPDATE developer SET name = ?, skills = ?, img = ? WHERE id = ${dev.id}`, data).then(res => {
      this.loadDevelopers();
      console.log(res);
    });
  }
  public loadProducts() {
    const query =
    'SELECT product.name, product.id, developer.name AS creator FROM product JOIN developer ON developer.id = product.creatorId';
    return this.database.executeSql(query, []).then(data => {
      const products = [];
      if (data.rows.length > 0) {
        for (let i = 0; i < data.rows.length; i++) {
          products.push({
            name: data.rows.item(i).name,
            id: data.rows.item(i).id,
            creator: data.rows.item(i).creator,
           });
        }
      }
      this.products.next(products);
    });
  }
  public addProduct(name, creator) {
    const data = [name, creator];
    return this.database.executeSql('INSERT INTO product (name, creatorId) VALUES (?, ?)', data).then(res => {
      this.loadProducts();
      console.log(res);
    });
  }
}
