const fs = require('fs');
fetch('https://caclltjrsfatglxrgcer.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhY2xsdGpyc2ZhdGdseHJnY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTI3NDYsImV4cCI6MjA5NDM4ODc0Nn0.xOVDVVOqTEvoOzire2iH45si7sbFhLJAlUH7VgdfgyY')
  .then(r => r.json())
  .then(data => {
    fs.writeFileSync('schema.json', JSON.stringify(data, null, 2));
    console.log('Saved schema.json');
  })
  .catch(console.error);
