import pymongo
import json
import ijson
import codecs
from decimal import Decimal
from bson.decimal128 import Decimal128
from pathlib import Path
import time

def convert_decimal(dict_item):
    # This function iterates a dictionary looking for types of Decimal and converts them to Decimal128
    # Embedded dictionaries and lists are called recursively.
    if dict_item is None: return None

    for k, v in list(dict_item.items()):
        if isinstance(v, dict):
            convert_decimal(v)
        elif isinstance(v, list):
            for l in v:
                convert_decimal(l)
        elif isinstance(v, Decimal):
            dict_item[k] = Decimal128(str(v))

    return dict_item


def cleanUp(insertValue): # This function cleans up some of the datatypes that might cause problems when inserting into the database
    if insertValue is None:
        return ""
    elif type(insertValue) is list:
        return(','.join(str(e) for e in insertValue))
    else:
        return(insertValue)


myclient = pymongo.MongoClient("mongodb+srv://7bizq8nmb:Z9BgOBpxTpkQSDXw@cluster0.bpzxjzp.mongodb.net/?retryWrites=true&w=majority&serverSelectionTimeoutMS=1000000")
db = myclient.test
mydb = myclient["Bourgogne"]
mycol = mydb["crus"]



directory = "/home/martin/dev/bourgogne"

files = Path(directory).glob('*.json')
for filename in files:
    print(filename)
    fn = open(filename)
    dataInsert = fn.read() # read the file into a variable
    #dataInsert = codecs.decode(dataInsert, 'unicode-escape') # start unicode cleanup
    #dataInsert = dataInsert.encode('latin1').decode('utf-8') # finish unicode cleanup
    dataInsert = json.loads(dataInsert)
    mycol.insert_many(dataInsert)
    fn.close()




