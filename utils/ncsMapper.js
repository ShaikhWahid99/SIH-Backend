// SIH-Backend/utils/ncsMapper.js
const mapSectorToNCS = (neo4jSector) => {
  // Normalize string: trim spaces and handle potential casing issues
  const sector = neo4jSector ? neo4jSector.trim() : "";

  const mapping = {
    "IT-ITeS": "IT and Communication",
    "Electronics & HW": "IT and Communication",
    "Telecom": "IT and Communication",
    "BFSI": "Finance and Insurance",
    "Healthcare": "Health",
    "Life Sciences": "Health",
    "Construction": "Civil and Construction Works",
    "Real Estate": "Civil and Construction Works",
    "Automotive": "Manufacturing",
    "Capital Goods & Manufacturing": "Manufacturing",
    "Iron & Steel": "Manufacturing",
    "Education, Training & Research": "Education",
    "Agriculture": "Agriculture and Related",
    "Food Industry/Food Processing": "Agriculture and Related",
    
    // ✅ FIX for your Arts user
    "Media & Entertainment": "Arts and Entertainment",
    "Arts & Entertainment": "Arts and Entertainment",
    "Design": "Arts and Entertainment",
    
    "Tourism & Hospitality": "Hotels, Food Service and Catering",
    "Power": "Power and Energy",
    "Oﬃce Administration & Facility Management": "Operations and Support",
    "Retail": "Operations and Support",
    "Indian Defence Forces": "International Organizations",
    "Public Administration": "International Organizations"
  };

  return mapping[sector] || "Operations and Support";
};

module.exports = { mapSectorToNCS };