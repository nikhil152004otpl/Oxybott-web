import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconRobot, IconPlay } from '../common/Icons';

const SNIPPETS = {
  oxycode: `// OxyCode Block Script (Robot Arm Pick & Place)
When Program Starts:
  Initialize ESP32 Servos(Base: Pin18, Shoulder: Pin19, Elbow: Pin23, Claw: Pin5)
  Set OLED Display "Oxybott Ready!"
  Forever:
    If Joystick_Button == PRESSED Then
      Set Claw Angle(85) // Open Claw
      Move Shoulder(45), Elbow(60)
      Wait 0.5 Seconds
      Set Claw Angle(20) // Close Claw
      OLED Display "Item Secured"
      Move Base to Angle(180) // Rotate
      Set Claw Angle(85) // Release
    End If`,
  arduino: `// Arduino IDE (C++) Oxybott QD022 Driver
#include <Oxybott_ESP32_Arm.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>

OxyArm arm(18, 19, 23, 5); // Base, Shoulder, Elbow, Gripper

void setup() {
  Serial.begin(115200);
  arm.begin();
  arm.homePosition();
  Serial.println("Oxybott QD022 Online");
}

void loop() {
  if (arm.readJoystickTrigger()) {
    arm.openGripper();
    arm.moveAxis(AXIS_SHOULDER, 45);
    delay(500);
    arm.closeGripper();
    arm.rotateBase(180);
    arm.openGripper();
  }
}`,
  python: `# MicroPython Oxybott QD022 Automation
from machine import Pin, PWM, I2C
import time
from oxybott import RobotArm, OLED

arm = RobotArm(base=18, shoulder=19, elbow=23, gripper=5)
oled = OLED(scl=22, sda=21)

oled.show_text("Oxybott Python")
arm.home()

while True:
    if arm.joystick_pressed():
        oled.show_text("Picking Object...")
        arm.set_gripper(open=True)
        arm.move_to(x=120, y=80, z=30)
        time.sleep(0.5)
        arm.set_gripper(open=False)
        arm.rotate_base(angle=180)
        arm.set_gripper(open=True)
        oled.show_text("Task Complete!")`
};

export default function CodeStudio({ cmsSection }) {
  const [lang, setLang] = useState('oxycode');
  const [simText, setSimText] = useState('Ready to run OxyCode script');
  const [simRunning, setSimRunning] = useState(false);

  const primaryBtn = cmsSection?.content?.primaryBtn || {};
  const btnText = primaryBtn.text || 'Download OxyCode IDE';
  const btnUrl = primaryBtn.url || '/software';

  const handleSimulate = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimText(`Executing ${lang} on ESP32 Dual-Core...`);

    setTimeout(() => {
      setSimText('Servos moving: Shoulder 45°, Elbow 60°...');
    }, 800);

    setTimeout(() => {
      setSimText('Task Complete! Object relocated 180°.');
      setSimRunning(false);
    }, 2000);
  };

  return (
    <section className="software-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{cmsSection?.tag || 'Multi-Language Ecosystem'}</span>
          <h2 className="section-title">{cmsSection?.title || 'One Robot, Infinite Ways to Code'}</h2>
          <p className="section-subtitle">
            {cmsSection?.subtitle || 'Start with intuitive OxyCode drag-and-drop visual blocks, then graduate effortlessly to Arduino C++ and industry-standard MicroPython.'}
          </p>
          {cmsSection?.description && (
            <p style={{ color: 'var(--oxy-gray-500)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              {cmsSection.description}
            </p>
          )}
        </div>

        <div className="code-studio-card">
          <div className="code-studio-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#7dd3fc' }}>
                OxyCode Studio Live Preview
              </span>
            </div>
            <div className="code-studio-tabs">
              <button
                type="button"
                className={`code-tab-btn ${lang === 'oxycode' ? 'active' : ''}`}
                onClick={() => { setLang('oxycode'); setSimText('Ready to run OxyCode script'); }}
              >
                OxyCode (Scratch)
              </button>
              <button
                type="button"
                className={`code-tab-btn ${lang === 'arduino' ? 'active' : ''}`}
                onClick={() => { setLang('arduino'); setSimText('Ready to compile Arduino C++'); }}
              >
                Arduino IDE (C++)
              </button>
              <button
                type="button"
                className={`code-tab-btn ${lang === 'python' ? 'active' : ''}`}
                onClick={() => { setLang('python'); setSimText('Ready to flash MicroPython script'); }}
              >
                MicroPython
              </button>
            </div>
          </div>

          <div className="code-studio-body">
            {/* Code Editor View */}
            <div className="code-editor-pane" tabIndex={0} role="region" aria-label="Code Example Editor">
              <pre><code id="codeSnippetDisplay">{SNIPPETS[lang]}</code></pre>
            </div>

            {/* Robot Simulation Preview */}
            <div className="code-preview-pane">
              <div className="robot-sim-box">
                <div
                  className="sim-robot-icon"
                  id="robotSimIcon"
                  style={{
                    transform: simRunning ? 'scale(1.15) rotate(12deg)' : 'scale(1)',
                    transition: 'transform 0.4s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconRobot size={44} style={{ color: 'var(--oxy-primary)' }} />
                </div>
                <div className="sim-status-text" id="simStatusText">
                  {simText}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--oxy-gray-500)', marginTop: '0.5rem' }}>
                  Target: Oxybott QD022 4-DOF Robotic Arm
                </p>
              </div>

              <div className="sim-controls">
                <button
                  type="button"
                  className="btn btn-orange"
                  id="runCodeBtn"
                  onClick={handleSimulate}
                  disabled={simRunning}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <IconPlay size={13} />
                  <span>{simRunning ? 'Running...' : 'Simulate Run'}</span>
                </button>
                {btnUrl.startsWith('http') ? (
                  <a href={btnUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    {btnText}
                  </a>
                ) : (
                  <Link to={btnUrl} className="btn btn-outline">
                    {btnText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
