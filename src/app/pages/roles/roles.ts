import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/roles.service';
import { PageService } from '../../core/services/page.service';
import { PermissionService } from '../../core/services/permission.service';
import { Role, RoleRequest, PagePermissionRequest } from '../../core/models/role.model';
import { Page } from '../../core/models/page.model';
import { Permission } from '../../core/models/permission.model';
import { UserService, UserResponse } from '../../core/services/user.service';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';


@Component({
  selector: 'app-roles-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
    roles = signal<Role[]>([]);
  allPages = signal<Page[]>([]);
  roleUserCounts = signal<Map<number, number>>(new Map());
  allPermissions = signal<Permission[]>([]);
assignedUsers = signal<UserResponse[]>([]);
  selectedRoleId = signal<number | null>(null);
  editMode = signal(false);
  showCreateModal = signal(false);

  // working copy while editing: pageId -> Set of permissionId
  draftName = signal('');
  draftDescription = signal('');
  draftGrid = signal<Map<number, Set<number>>>(new Map());

  selectedRole = computed(() =>
    this.roles().find(r => r.id === this.selectedRoleId()) ?? null
  );

  permissionCount = (role: Role) =>
    role.pagePermissions.reduce((sum, pp) => sum + pp.permissions.length, 0);

  constructor(
    private roleService: RoleService,
    private pageService: PageService,
    private permissionService: PermissionService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.pageService.getAllPages().subscribe(pages => this.allPages.set(pages));
    this.permissionService.getAllPermissions().subscribe(perms => this.allPermissions.set(perms));
    this.loadRoles();
  }

  loadRoles(selectFirst = true): void {
  this.roleService.getAllRoles().subscribe(roles => {
    this.roles.set(roles);
    if (selectFirst && roles.length && this.selectedRoleId() === null) {
      this.selectRole(roles[0].id);
    }
    this.loadAllRoleUserCounts(roles);
  });
}

userCountFor(roleId: number): number {
  return this.roleUserCounts().get(roleId) ?? 0;
}

loadAllRoleUserCounts(roles: Role[]): void {
  if (!roles.length) return;
  const requests = roles.map(r =>
    this.userService.searchUsers(undefined, r.id)
  );
  forkJoin(requests).subscribe(results => {
    const counts = new Map<number, number>();
    roles.forEach((r, i) => counts.set(r.id, results[i].length));
    this.roleUserCounts.set(counts);
  });
}

  selectRole(id: number): void {
    this.selectedRoleId.set(id);
    this.editMode.set(false);
    this.loadAssignedUsers(id);
  }

  loadAssignedUsers(roleId: number): void {
    this.userService.searchUsers(undefined, roleId).subscribe(users => {
      this.assignedUsers.set(users);
    });
  }

  hasPermission(pageId: number, permissionId: number): boolean {
    const role = this.selectedRole();
    if (!role) return false;
    const group = role.pagePermissions.find(pp => pp.page.pageId === pageId);
    return !!group?.permissions.some(p => p.permissionId === permissionId);
  }

  startEdit(): void {
    const role = this.selectedRole();
    if (!role) return;

    const grid = new Map<number, Set<number>>();
    for (const page of this.allPages()) {
      const group = role.pagePermissions.find(pp => pp.page.pageId === page.id);
      grid.set(page.id, new Set(group?.permissions.map(p => p.permissionId) ?? []));
    }

    this.draftName.set(role.name);
    this.draftDescription.set(role.description ?? '');
    this.draftGrid.set(grid);
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  toggleDraftPermission(pageId: number, permissionId: number): void {
    const grid = this.draftGrid();
    const set = grid.get(pageId) ?? new Set<number>();
    if (set.has(permissionId)) {
      set.delete(permissionId);
    } else {
      set.add(permissionId);
    }
    grid.set(pageId, set);
    this.draftGrid.set(new Map(grid));
  }

  isDraftChecked(pageId: number, permissionId: number): boolean {
    return this.draftGrid().get(pageId)?.has(permissionId) ?? false;
  }

  saveEdit(): void {
    const role = this.selectedRole();
    if (!role) return;

    const pagePermissions: PagePermissionRequest[] = [];
    this.draftGrid().forEach((permIds, pageId) => {
      if (permIds.size > 0) {
        pagePermissions.push({ pageId, permissionIds: Array.from(permIds) });
      }
    });

    const request: RoleRequest = {
      name: this.draftName(),
      description: this.draftDescription(),
      pagePermissions,
    };

    this.roleService.updateRole(role.id, request).subscribe(() => {
      this.editMode.set(false);
      this.loadRoles(false);
    });
  }

  // deleteRole(): void {
  //   const role = this.selectedRole();
  //   if (!role) return;
  //   if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;

  //   this.roleService.deleteRole(role.id).subscribe(() => {
  //     this.selectedRoleId.set(null);
  //     this.loadRoles();
  //   });
  // }

  openCreateModal(): void {
    this.draftName.set('');
    this.draftDescription.set('');
    this.draftGrid.set(new Map(this.allPages().map(p => [p.id, new Set<number>()])));
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createRole(): void {
    const pagePermissions: PagePermissionRequest[] = [];
    this.draftGrid().forEach((permIds, pageId) => {
      if (permIds.size > 0) {
        pagePermissions.push({ pageId, permissionIds: Array.from(permIds) });
      }
    });

    const request: RoleRequest = {
      name: this.draftName(),
      description: this.draftDescription(),
      pagePermissions,
    };

    this.roleService.createRole(request).subscribe(role => {
      this.showCreateModal.set(false);
      this.loadRoles(false);
      this.selectRole(role.id);
    });
  }

  private roleColors: Record<string, string> = {
  ADMIN: '#e03131',
  MANAGER: '#1971c2',
  EDITOR: '#228be6',
  EMPLOYEE: '#228be6',
  VIEWER: '#868e96',
};

private palette = ['#e03131', '#1971c2', '#228be6', '#868e96', '#f08c00', '#2f9e44'];

roleColor(role: Role): string {
  const key = role.name?.toUpperCase();
  if (key && this.roleColors[key]) return this.roleColors[key];
  const idx = this.roles().findIndex(r => r.id === role.id);
  return this.palette[idx % this.palette.length];
}

// add these signals near your other signals:
showDeleteConfirm = signal(false);

// replace your existing deleteRole() with this:
deleteRole(): void {
  this.showDeleteConfirm.set(true);
}

confirmDelete(): void {
  const role = this.selectedRole();
  if (!role) return;

  this.roleService.deleteRole(role.id).subscribe(() => {
    this.selectedRoleId.set(null);
    this.showDeleteConfirm.set(false);
    this.loadRoles();
  });
}

cancelDelete(): void {
  this.showDeleteConfirm.set(false);
}
}