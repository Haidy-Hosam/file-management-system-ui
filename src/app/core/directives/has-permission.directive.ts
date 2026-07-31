import { Directive, Input, TemplateRef, ViewContainerRef, effect, signal } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';

@Directive({ selector: '[appHasPermission]', standalone: true })
export class HasPermissionDirective {
  private page = signal('');
  private permission = signal('');
  private hasView = false;

  @Input() set appHasPermission([page, permission]: [string, string]) {
    this.page.set(page);
    this.permission.set(permission);
  }

  constructor(
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef,
    private perms: PermissionsService
  ) {
    effect(() => {
      const allowed = this.perms.has(this.page(), this.permission());
      if (allowed && !this.hasView) { this.vcr.createEmbeddedView(this.tpl); this.hasView = true; }
      if (!allowed && this.hasView) { this.vcr.clear(); this.hasView = false; }
    });
  }
}