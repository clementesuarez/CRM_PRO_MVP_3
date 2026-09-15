export interface CatalogoVehiculoItem {
  id: number;
  marca: string;
  modelo: string;
  version_completa: string;
  tipo: 'Sedán' | 'Hatchback' | 'SUV / Crossover' | 'Pick-up / Camioneta' | 'Coupe / Deportivo' | 'Monovolumen / Utilitario' | 'Otro';
  origen: 'Nacional' | 'Importado';
  anios_disponibles: number[];
}

export const CATALOGO_ARGENTINA: CatalogoVehiculoItem[] = [
  // TOYOTA
  { id: 1, marca: 'Toyota', modelo: 'Hilux', version_completa: 'Hilux 2.8 TDI SRX 4x4 AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 2, marca: 'Toyota', modelo: 'Hilux', version_completa: 'Hilux 2.8 TDI SRV 4x4 MT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 3, marca: 'Toyota', modelo: 'Hilux', version_completa: 'Hilux 2.4 TDI DX 4x2 MT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 4, marca: 'Toyota', modelo: 'Corolla', version_completa: 'Corolla 2.0 SEG CVT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 5, marca: 'Toyota', modelo: 'Corolla', version_completa: 'Corolla 1.8 XEI CVT Híbrido', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 6, marca: 'Toyota', modelo: 'Corolla', version_completa: 'Corolla 1.8 XEI MT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2014, 2015, 2016, 2017, 2018, 2019] },
  { id: 7, marca: 'Toyota', modelo: 'Corolla Cross', version_completa: 'Corolla Cross 2.0 XEI CVT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 8, marca: 'Toyota', modelo: 'Corolla Cross', version_completa: 'Corolla Cross 1.8 SEG e-CVT Híbrida', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 9, marca: 'Toyota', modelo: 'Etios', version_completa: 'Etios 1.5 XLS 5P MT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 10, marca: 'Toyota', modelo: 'Etios', version_completa: 'Etios 1.5 X 4P MT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 11, marca: 'Toyota', modelo: 'Yaris', version_completa: 'Yaris 1.5 XLS Hatch CVT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 12, marca: 'Toyota', modelo: 'Yaris', version_completa: 'Yaris 1.5 S Hatch MT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 13, marca: 'Toyota', modelo: 'SW4', version_completa: 'SW4 2.8 TDI Diamond 4x4 AT', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 14, marca: 'Toyota', modelo: 'RAV4', version_completa: 'RAV4 2.5 HV AWD Limited', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2019, 2020, 2021, 2022, 2023, 2024] },

  // VOLKSWAGEN
  { id: 20, marca: 'Volkswagen', modelo: 'Amarok', version_completa: 'Amarok 3.0 V6 Highline 4Motion AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 21, marca: 'Volkswagen', modelo: 'Amarok', version_completa: 'Amarok 3.0 V6 Extreme 4Motion AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 22, marca: 'Volkswagen', modelo: 'Amarok', version_completa: 'Amarok 2.0 TDI Comfortline 4x2 MT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 23, marca: 'Volkswagen', modelo: 'Gol Trend', version_completa: 'Gol Trend 1.6 MSI Trendline 5P', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021] },
  { id: 24, marca: 'Volkswagen', modelo: 'Gol Trend', version_completa: 'Gol Trend 1.6 Highline 5P', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2013, 2014, 2015, 2016, 2017, 2018] },
  { id: 25, marca: 'Volkswagen', modelo: 'Polo', version_completa: 'Polo Track 1.0 MPI', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2023, 2024, 2025] },
  { id: 26, marca: 'Volkswagen', modelo: 'Polo', version_completa: 'Polo 1.6 MSI Comfortline Tiptronic', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 27, marca: 'Volkswagen', modelo: 'Polo', version_completa: 'Polo GTS 1.4 TSI 250 Tiptronic', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 28, marca: 'Volkswagen', modelo: 'Taos', version_completa: 'Taos 1.4 250 TSI Highline Tiptronic', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 29, marca: 'Volkswagen', modelo: 'Taos', version_completa: 'Taos 1.4 250 TSI Comfortline Tiptronic', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 30, marca: 'Volkswagen', modelo: 'T-Cross', version_completa: 'T-Cross 1.0 TSI Highline Tiptronic', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 31, marca: 'Volkswagen', modelo: 'Nivus', version_completa: 'Nivus 1.0 200 TSI Highline Tiptronic', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 32, marca: 'Volkswagen', modelo: 'Nivus', version_completa: 'Nivus 1.0 170 TSI 5MT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 33, marca: 'Volkswagen', modelo: 'Vento', version_completa: 'Vento 1.4 TSI Comfortline Tiptronic', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020] },
  { id: 34, marca: 'Volkswagen', modelo: 'Vento', version_completa: 'Vento GLI 2.0 TSI DSG', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 35, marca: 'Volkswagen', modelo: 'Golf', version_completa: 'Golf VII 1.4 TSI Highline DSG', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019] },
  { id: 36, marca: 'Volkswagen', modelo: 'Golf', version_completa: 'Golf VII GTI 2.0 TSI DSG', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020] },
  { id: 37, marca: 'Volkswagen', modelo: 'Suran', version_completa: 'Suran 1.6 Highline 5P', tipo: 'Monovolumen / Utilitario', origen: 'Nacional', anios_disponibles: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
  { id: 38, marca: 'Volkswagen', modelo: 'Saveiro', version_completa: 'Saveiro 1.6 Cross Doble Cabina', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },

  // FIAT
  { id: 40, marca: 'Fiat', modelo: 'Cronos', version_completa: 'Cronos 1.3 GSE Drive Pack Plus', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 41, marca: 'Fiat', modelo: 'Cronos', version_completa: 'Cronos 1.3 GSE Precision CVT', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 42, marca: 'Fiat', modelo: 'Cronos', version_completa: 'Cronos 1.8 16v Precision AT6', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2018, 2019, 2020, 2021, 2022] },
  { id: 43, marca: 'Fiat', modelo: 'Argo', version_completa: 'Argo 1.3 GSE Drive Connect', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 44, marca: 'Fiat', modelo: 'Toro', version_completa: 'Toro 2.0 TDI Volcano 4x4 AT9', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 45, marca: 'Fiat', modelo: 'Toro', version_completa: 'Toro 1.8 Freedom 4x2 AT6', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 46, marca: 'Fiat', modelo: 'Toro', version_completa: 'Toro 1.3T T270 Volcano AT6', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 47, marca: 'Fiat', modelo: 'Pulse', version_completa: 'Pulse 1.3 Drive MT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 48, marca: 'Fiat', modelo: 'Pulse', version_completa: 'Pulse 1.0T Audace CVT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 49, marca: 'Fiat', modelo: 'Strada', version_completa: 'Strada 1.3 Volcano Doble Cabina CVT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 50, marca: 'Fiat', modelo: 'Strada', version_completa: 'Strada 1.3 Freedom Cabina Doble MT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024] },
  { id: 51, marca: 'Fiat', modelo: 'Fiorino', version_completa: 'Fiorino 1.4 Fire EVO Furgón', tipo: 'Monovolumen / Utilitario', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 52, marca: 'Fiat', modelo: 'Mobi', version_completa: 'Mobi 1.0 Like 5P', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021, 2022, 2023] },

  // PEUGEOT
  { id: 60, marca: 'Peugeot', modelo: '208', version_completa: '208 1.6 Feline Tiptronic', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 61, marca: 'Peugeot', modelo: '208', version_completa: '208 1.6 Allure MT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 62, marca: 'Peugeot', modelo: '208', version_completa: '208 1.2 Like MT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024] },
  { id: 63, marca: 'Peugeot', modelo: '208', version_completa: '208 1.0T GT T200 CVT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2024, 2025] },
  { id: 64, marca: 'Peugeot', modelo: '2008', version_completa: '2008 1.6 THP Sport Tiptronic', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 65, marca: 'Peugeot', modelo: '2008', version_completa: '2008 1.0T GT T200 CVT Nuevo Modelo', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2024, 2025] },
  { id: 66, marca: 'Peugeot', modelo: '3008', version_completa: '3008 1.6 THP Allure Tiptronic', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 67, marca: 'Peugeot', modelo: 'Partner', version_completa: 'Partner 1.6 HDI Furgón Confort', tipo: 'Monovolumen / Utilitario', origen: 'Nacional', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },

  // CHEVROLET
  { id: 70, marca: 'Chevrolet', modelo: 'Cruze', version_completa: 'Cruze 1.4T Premier Sedán AT', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2019, 2020, 2021, 2022, 2023] },
  { id: 71, marca: 'Chevrolet', modelo: 'Cruze', version_completa: 'Cruze 1.4T LTZ Hatch 5P AT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 72, marca: 'Chevrolet', modelo: 'Cruze', version_completa: 'Cruze 1.4T LT Sedán MT', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022] },
  { id: 73, marca: 'Chevrolet', modelo: 'Tracker', version_completa: 'Tracker 1.2T Premier AT', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 74, marca: 'Chevrolet', modelo: 'Tracker', version_completa: 'Tracker 1.2T LTZ AT', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 75, marca: 'Chevrolet', modelo: 'Onix', version_completa: 'Onix 1.0T Premier AT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 76, marca: 'Chevrolet', modelo: 'Onix Plus', version_completa: 'Onix Plus 1.0T Premier Sedán AT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 77, marca: 'Chevrolet', modelo: 'Onix', version_completa: 'Onix 1.2 LT MT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024] },
  { id: 78, marca: 'Chevrolet', modelo: 'S10', version_completa: 'S10 2.8 CTDI High Country 4x4 AT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 79, marca: 'Chevrolet', modelo: 'S10', version_completa: 'S10 2.8 CTDI LTZ 4x4 MT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 80, marca: 'Chevrolet', modelo: 'Spin', version_completa: 'Spin 1.8 LTZ 7 Asientos AT', tipo: 'Monovolumen / Utilitario', origen: 'Importado', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 81, marca: 'Chevrolet', modelo: 'Montana', version_completa: 'Montana 1.2T Premier AT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2023, 2024, 2025] },

  // FORD
  { id: 90, marca: 'Ford', modelo: 'Ranger', version_completa: 'Ranger 3.0 V6 Limited Plus 4WD AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2023, 2024, 2025] },
  { id: 91, marca: 'Ford', modelo: 'Ranger', version_completa: 'Ranger 2.0 Bi-Turbo XLS 4x4 AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2023, 2024, 2025] },
  { id: 92, marca: 'Ford', modelo: 'Ranger', version_completa: 'Ranger 3.2 TDCi Limited 4x4 AT (Línea Anterior)', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 93, marca: 'Ford', modelo: 'Ranger', version_completa: 'Ranger 2.2 TDCi XL 4x2 MT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 94, marca: 'Ford', modelo: 'Focus', version_completa: 'Focus III 2.0 Titanium 5P Powershift/AT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2014, 2015, 2016, 2017, 2018, 2019] },
  { id: 95, marca: 'Ford', modelo: 'Focus', version_completa: 'Focus III 2.0 SE Plus Sedán MT', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2014, 2015, 2016, 2017, 2018, 2019] },
  { id: 96, marca: 'Ford', modelo: 'Fiesta Kinetic', version_completa: 'Fiesta KD 1.6 Titanium 5P MT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2013, 2014, 2015, 2016, 2017, 2018, 2019] },
  { id: 97, marca: 'Ford', modelo: 'EcoSport', version_completa: 'EcoSport 1.5 Titanium MT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021] },
  { id: 98, marca: 'Ford', modelo: 'EcoSport', version_completa: 'EcoSport 2.0 Freestyle 4x4 MT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2014, 2015, 2016, 2017, 2018, 2019] },
  { id: 99, marca: 'Ford', modelo: 'Ka', version_completa: 'Ka 1.5 Freestyle 5P MT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021] },
  { id: 100, marca: 'Ford', modelo: 'Ka', version_completa: 'Ka 1.5 SEL Sedán MT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021] },
  { id: 101, marca: 'Ford', modelo: 'Territory', version_completa: 'Territory 1.8T Titanium AT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2023, 2024, 2025] },
  { id: 102, marca: 'Ford', modelo: 'Maverick', version_completa: 'Maverick 2.0 EcoBoost Lariat 4WD AT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },

  // RENAULT
  { id: 110, marca: 'Renault', modelo: 'Sandero', version_completa: 'Sandero 1.6 16v Intens CVT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 111, marca: 'Renault', modelo: 'Stepway', version_completa: 'Stepway 1.6 16v Intens MT', tipo: 'Hatchback', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 112, marca: 'Renault', modelo: 'Logan', version_completa: 'Logan 1.6 16v Zen MT', tipo: 'Sedán', origen: 'Nacional', anios_disponibles: [2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 113, marca: 'Renault', modelo: 'Duster', version_completa: 'Duster 1.3 TCe Iconic 4x4 MT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 114, marca: 'Renault', modelo: 'Duster', version_completa: 'Duster 1.6 Intens CVT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 115, marca: 'Renault', modelo: 'Duster Oroch', version_completa: 'Oroch 1.3 TCe Outsider 4x4 MT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 116, marca: 'Renault', modelo: 'Kangoo', version_completa: 'Kangoo II 1.5 dCi Stepway 5 Asientos', tipo: 'Monovolumen / Utilitario', origen: 'Nacional', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 117, marca: 'Renault', modelo: 'Kangoo', version_completa: 'Kangoo II 1.6 SCe Furgón Confort', tipo: 'Monovolumen / Utilitario', origen: 'Nacional', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 118, marca: 'Renault', modelo: 'Alaskan', version_completa: 'Alaskan 2.3 dCi Iconic 4x4 AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 119, marca: 'Renault', modelo: 'Kwid', version_completa: 'Kwid 1.0 Zen MT', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022] },

  // NISSAN
  { id: 130, marca: 'Nissan', modelo: 'Frontier', version_completa: 'Frontier 2.3 Bi-Turbo PRO-4X 4x4 AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 131, marca: 'Nissan', modelo: 'Frontier', version_completa: 'Frontier 2.3 Bi-Turbo Platinum 4x4 AT', tipo: 'Pick-up / Camioneta', origen: 'Nacional', anios_disponibles: [2020, 2021, 2022, 2023, 2024] },
  { id: 132, marca: 'Nissan', modelo: 'Kicks', version_completa: 'Kicks 1.6 Exclusive CVT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 133, marca: 'Nissan', modelo: 'Versa', version_completa: 'Versa 1.6 Exclusive CVT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024, 2025] },
  { id: 134, marca: 'Nissan', modelo: 'Sentra', version_completa: 'Sentra 2.0 SR CVT', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },

  // JEEP
  { id: 140, marca: 'Jeep', modelo: 'Renegade', version_completa: 'Renegade 1.3 T270 Serie-S AT6', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 141, marca: 'Jeep', modelo: 'Renegade', version_completa: 'Renegade 1.8 Sport AT6', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021, 2022] },
  { id: 142, marca: 'Jeep', modelo: 'Compass', version_completa: 'Compass 1.3 T270 Limited AT6', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2021, 2022, 2023, 2024, 2025] },
  { id: 143, marca: 'Jeep', modelo: 'Compass', version_completa: 'Compass 2.4 Tigershark Longitude AT9 4x4', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021] },
  { id: 144, marca: 'Jeep', modelo: 'Commander', version_completa: 'Commander 2.0 TD380 Overland 4x4 AT9', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },

  // CITROËN
  { id: 150, marca: 'Citroën', modelo: 'C4 Cactus', version_completa: 'C4 Cactus 1.6 THP Shine AT6', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023, 2024] },
  { id: 151, marca: 'Citroën', modelo: 'C4 Cactus', version_completa: 'C4 Cactus 1.6 VTi Feel Pack MT', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 152, marca: 'Citroën', modelo: 'C3', version_completa: 'C3 1.2 PureTech Feel MT (Nuevo Modelo)', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2022, 2023, 2024, 2025] },
  { id: 153, marca: 'Citroën', modelo: 'Berlingo', version_completa: 'Berlingo 1.6 HDi Multispace', tipo: 'Monovolumen / Utilitario', origen: 'Nacional', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },

  // HONDA
  { id: 160, marca: 'Honda', modelo: 'HR-V', version_completa: 'HR-V 1.5 Touring CVT (Línea Nueva)', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2024, 2025] },
  { id: 161, marca: 'Honda', modelo: 'HR-V', version_completa: 'HR-V 1.8 EX-L CVT', tipo: 'SUV / Crossover', origen: 'Nacional', anios_disponibles: [2016, 2017, 2018, 2019, 2020, 2021] },
  { id: 162, marca: 'Honda', modelo: 'Civic', version_completa: 'Civic 2.0 EX-L CVT 10ma Gen', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021] },
  { id: 163, marca: 'Honda', modelo: 'Fit', version_completa: 'Fit 1.5 EX-L CVT 3ra Gen', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021] },

  // RAM & AUDI & BMW
  { id: 170, marca: 'RAM', modelo: 'Rampage', version_completa: 'Rampage 2.0T R/T AWD 9AT', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2024, 2025] },
  { id: 171, marca: 'RAM', modelo: '1500', version_completa: 'RAM 1500 5.7 V8 HEMI Laramie 4x4', tipo: 'Pick-up / Camioneta', origen: 'Importado', anios_disponibles: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 180, marca: 'Audi', modelo: 'A3', version_completa: 'Audi A3 Sportback 1.4 TFSI S-Tronic', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2017, 2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 181, marca: 'Audi', modelo: 'Q3', version_completa: 'Audi Q3 35 TFSI S-Tronic', tipo: 'SUV / Crossover', origen: 'Importado', anios_disponibles: [2020, 2021, 2022, 2023, 2024] },
  { id: 190, marca: 'BMW', modelo: 'Serie 1', version_completa: 'BMW 118i M Sport Steptronic', tipo: 'Hatchback', origen: 'Importado', anios_disponibles: [2018, 2019, 2020, 2021, 2022, 2023] },
  { id: 191, marca: 'BMW', modelo: 'Serie 3', version_completa: 'BMW 330i SportLine Steptronic', tipo: 'Sedán', origen: 'Importado', anios_disponibles: [2019, 2020, 2021, 2022, 2023, 2024] }
];

/**
 * Búsqueda predictiva optimizada (<15ms)
 * Permite buscar por marca, modelo, o fragmentos del nombre completo
 */
export function buscarEnCatalogo(query: string, limit: number = 8): CatalogoVehiculoItem[] {
  if (!query || query.trim().length < 2) return [];

  const tokens = query.toLowerCase().trim().split(/\s+/);

  return CATALOGO_ARGENTINA.filter((item) => {
    const haystack = `${item.marca} ${item.modelo} ${item.version_completa}`.toLowerCase();
    // Todos los tokens ingresados deben encontrarse en el texto del vehículo
    return tokens.every((token) => haystack.includes(token));
  }).slice(0, limit);
}
