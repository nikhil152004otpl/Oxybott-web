import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { IconArrowRight } from './Icons';

export default function MegaMenu({ onClose }) {
  const [activeTab, setActiveTab] = useState('megaPaneSeries');
  const { products, formatPrice } = useStore();

  const getProductPrice = (id, fallback) => {
    const prod = products.find(p => p.id === id || p.slug === id);
    if (prod && prod.price) {
      return formatPrice(prod.price);
    }
    return formatPrice(fallback);
  };

  return (
    <div className="mega-menu-dropdown">
      <div className="container mega-menu-container">
        {/* Left Tabs */}
        <div className="mega-tabs">
          <button
            type="button"
            className={`mega-tab-btn ${activeTab === 'megaPaneSeries' ? 'active' : ''}`}
            onMouseEnter={() => setActiveTab('megaPaneSeries')}
            onClick={() => setActiveTab('megaPaneSeries')}
          >
            <span>Series</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M6 12L10 8L6 4" strokeWidth="2"/></svg>
          </button>
          <button
            type="button"
            className={`mega-tab-btn ${activeTab === 'megaPaneAge' ? 'active' : ''}`}
            onMouseEnter={() => setActiveTab('megaPaneAge')}
            onClick={() => setActiveTab('megaPaneAge')}
          >
            <span>Kits For Age</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M6 12L10 8L6 4" strokeWidth="2"/></svg>
          </button>
        </div>

        {/* Right Panes */}
        <div className="mega-content">
          {/* Pane 1: Series */}
          <div className={`mega-pane ${activeTab === 'megaPaneSeries' ? 'active' : ''}`} id="megaPaneSeries">
            <div className="mega-grid-series">
              {/* Explorer Series */}
              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Explorer Series</h4>
                  <span className="mega-col-sub">For Beginners &amp; Kids</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qe011" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe011-weather-station.png" alt="Weather Station" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Weather Station Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe011', 4149)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qd001" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd001-robot-car.png" alt="Smart Robot Car" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Smart Robot Car Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qd001', 5809)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qe001" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe001-smart-home.png" alt="Smart Home IOT" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Smart Home IoT Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe001', 4979)}</div>
                    </div>
                  </Link>
                </div>
                <Link to="/products?series=Explorer+Series" className="mega-learn-all" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Explore Series</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>

              {/* Education Series */}
              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Education Series</h4>
                  <span className="mega-col-sub">For Educators &amp; Schools</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qe023" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe023-smart-home-edu.png" alt="Smart Home Edu" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Smart Home Display Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe023', 10789)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qe036" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe036-transportation-kit.jpg" alt="Transportation Kit" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Transportation Kit L2</div>
                      <div className="mega-prod-price">{getProductPrice('qe036', 11619)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qe037" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe037-smart-factory.jpg" alt="Smart Factory" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Smart Factory Edu Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe037', 13279)}</div>
                    </div>
                  </Link>
                </div>
                <Link to="/products?series=Education+Series" className="mega-learn-all" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Explore Series</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>

              {/* Inventor Series */}
              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Inventor Series</h4>
                  <span className="mega-col-sub">For Age 12+ &amp; Makers</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qd022" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd022-robot-arm.png" alt="Robot Arm" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Programmable Arm Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qd022', 7469)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qd021" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd021-biped-robot.png" alt="Biped Robot" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Bionic Biped Robot</div>
                      <div className="mega-prod-price">{getProductPrice('qd021', 6639)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qd020" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd020-spider-robot.png" alt="Spider Robot" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Spider Robot Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qd020', 7054)}</div>
                    </div>
                  </Link>
                </div>
                <Link to="/products?series=Inventor+Series" className="mega-learn-all" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Explore Series</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>

              {/* Maker Series */}
              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Maker Series</h4>
                  <span className="mega-col-sub">Sensors &amp; Development</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qe200" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe200-starter-kit.jpg" alt="Starter Kit" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">ESP32 Starter Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe200', 3319)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qe202" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe202-sensor-kit.jpg" alt="Sensor Kit" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">37-in-1 Sensor Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe202', 5394)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qd028" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd028-battle-car.webp" alt="Battle Car" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Battle Car 2-in-1</div>
                      <div className="mega-prod-price">{getProductPrice('qd028', 4979)}</div>
                    </div>
                  </Link>
                </div>
                <Link to="/products?series=Maker+Series" className="mega-learn-all" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Explore Series</span>
                  <IconArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Pane 2: Kits For Age */}
          <div className={`mega-pane ${activeTab === 'megaPaneAge' ? 'active' : ''}`} id="megaPaneAge">
            <div className="mega-grid-series">
              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Age 8+ (Grade 3)</h4>
                  <span className="mega-col-sub">Playful Coding Basics</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qd024" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd024-microbit-car.png" alt="Microbit Car" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Micro:bit Car Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qd024', 4564)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qd028" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd028-battle-car.webp" alt="Battle Car" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Football &amp; Battle Car</div>
                      <div className="mega-prod-price">{getProductPrice('qd028', 4979)}</div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Age 10+ (Grade 4-5)</h4>
                  <span className="mega-col-sub">Sensors &amp; Automation</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qe011" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe011-weather-station.png" alt="Weather Station" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Weather Station Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe011', 4149)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qe001" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe001-smart-home.png" alt="Smart Home" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Smart Home Starter</div>
                      <div className="mega-prod-price">{getProductPrice('qe001', 4979)}</div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Age 12+ (Grade 6-7)</h4>
                  <span className="mega-col-sub">Kinematics &amp; Bionics</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qd022" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd022-robot-arm.png" alt="Arm" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Robot Arm Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qd022', 7469)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qd021" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qd021-biped-robot.png" alt="Biped" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Biped Robot Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qd021', 6639)}</div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="mega-series-col">
                <div className="mega-col-header">
                  <h4 className="mega-col-title">Age 14+ (Grade 8+)</h4>
                  <span className="mega-col-sub">Smart Cities &amp; IoT</span>
                </div>
                <div className="mega-product-list">
                  <Link to="/products/qe037" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe037-smart-factory.jpg" alt="Factory" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">Smart Factory Simulator</div>
                      <div className="mega-prod-price">{getProductPrice('qe037', 13279)}</div>
                    </div>
                  </Link>
                  <Link to="/products/qe032" className="mega-product-link" onClick={onClose}>
                    <img src="/assets/images/qe032-truckbott.png" alt="TruckBott" className="mega-prod-thumb" />
                    <div className="mega-prod-info">
                      <div className="mega-prod-name">TruckBott AGV Kit</div>
                      <div className="mega-prod-price">{getProductPrice('qe032', 9959)}</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
