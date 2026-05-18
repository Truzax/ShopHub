import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ResetConfirmation } from './reset-confirmation';

describe('ResetConfirmation', () => {
  let component: ResetConfirmation;
  let fixture: ComponentFixture<ResetConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetConfirmation],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetConfirmation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
