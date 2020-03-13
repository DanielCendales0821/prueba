import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  users = [];
  constructor(private apiService: ApiService, private plt: Platform) { }
  ngOnInit() {
    this.plt.ready().then(() => {
      this.loadData(true);
    });
  }
  loadData(refresh = false, refresher?) {
    this.apiService.getUsers(refresh).subscribe(res => {
      this.users = res;
      if (refresher) {
        refresher.target.complete();
      }
    });
  }
  updateUser(id) {
    this.apiService.updateUser(id, {name: 'Simon', job: 'CEO'}).subscribe();
  }

}
