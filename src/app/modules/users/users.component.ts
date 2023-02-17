import {Component, OnInit} from '@angular/core';
import {UsersService} from '@core/services/users/users.service';
import {RolesList} from '@core/app.roles';
import {UsersModel} from '@models';
import {RolesModel} from "../../models/Roles";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  usersArray;
  editedRoles = {};

  constructor(
    private usersService: UsersService,
  ) {
  }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers() {
    this.usersService.getUsers().subscribe((resp: UsersModel[]) => {
      this.usersArray = resp.map(item => {
        this.editedRoles[item.id] = false;
        item.rolesInfo = RolesList.find(el => item.role === el.id);
        return item;
      });
    });
  }

  deleteUser(id: number){
    this.usersService.delete(id).subscribe((resp: any) => {
        for (var i = 0; i < this.usersArray.length; i++) {
            if (this.usersArray[i].id == id) {
                delete this.usersArray[i];
                break;
            }
        }
    });
  }

  editRole(id: number){
      this.editedRoles[id] = true;
  }

  saveRole(id: number, role: number){
      console.log(id, role);
      this.usersService.changeRole(id, role).subscribe((resp: any) => {
          this.editedRoles[id] = false;
          for (var i = 0; i < this.usersArray.length; i++) {
              if (this.usersArray[i].id == id) {
                  for (var j = 0; j < RolesList.length; j++) {
                      console.log(RolesList[j].id, this.usersArray[i].role);
                      if (RolesList[j].id == this.usersArray[i].role) {
                          this.usersArray[i].rolesInfo = RolesList[j];
                      }
                  }
              }
          }
      });
  }
}
