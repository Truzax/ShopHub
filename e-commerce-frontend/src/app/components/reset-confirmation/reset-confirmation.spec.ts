import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetConfirmation } from './reset-confirmation';

describe('ResetConfirmation', () => {
  let component: ResetConfirmation;
  let fixture: ComponentFixture<ResetConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetConfirmation],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetConfirmation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
