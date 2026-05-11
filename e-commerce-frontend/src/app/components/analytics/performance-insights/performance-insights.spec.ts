import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceInsights } from './performance-insights';

describe('PerformanceInsights', () => {
  let component: PerformanceInsights;
  let fixture: ComponentFixture<PerformanceInsights>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceInsights],
    }).compileComponents();

    fixture = TestBed.createComponent(PerformanceInsights);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
