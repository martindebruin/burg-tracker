import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    # Read CSV file with the appropriate encoding
    with open(csv_file_path, 'r', encoding='latin-1') as csv_file:
        csv_data = csv.DictReader(csv_file)
        
        # Convert CSV to JSON
        json_data = []
        for row in csv_data:
            json_data.append(row)
        
        # Write JSON data to file
        with open(json_file_path, 'w') as json_file:
            json_file.write(json.dumps(json_data, indent=4))
    
    print("Conversion completed successfully!")

# Provide the paths for the CSV and JSON files
csv_file_path = 'test.csv'
json_file_path = 'list.json'

# Convert CSV to JSON
csv_to_json(csv_file_path, json_file_path)
