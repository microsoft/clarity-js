Schema represents the structure of an arbitrary JavaScript variable. For Objects, the goal is to list its property names without property values, as an array.

The gist of the idea can be illustrated with a simple example:

```javascript
let car = {  
  make: "Tesla",  
  year: 2018  
};  
schema(car) = ["make", "year"]
```

However, schemas needs to be able to handle more complex objects, which can have properties of arbitrary types, which might require their own schemas. When we think about these slightly harder cases, there are two issues that come up that need to be handled as special cases.

### Handling nested Objects

```javascript
let car = {  
  make: "Tesla",  
  year: 2018,  
  features: {  
    color: "red",  
  }  
}
```

Now, to construct a schema for 'car', it's not enough to just say ["make, "year", "features"], because features has a schema of its own, which needs to be respected as well. To take that into account, we need to add an extra dimension to the features representation, which would allow us to pass two pieces of inofrmation for the features object - property name, under which it's stored in the car object and features's own schema. It can look something like this:

featuresSchema = ["features", ["color"]]  
schema(car) = [ "make", "year", featuresSchema ]

### Differentiating Object's schema arrays from actual arrays of data

Last problem that we need to handle is disambiguation between the arrays describing Objects schemas and arrays describing Array schemas. We can do it the same way we handle nested objects - by adding an extra dimension indicating what is the object type that is being described by this schema - Object or an Array. 

Here is a more complicated example containing three schema types (primitive, array, object) nested within another object. 

```javascript
let car = {  
  make: "Tesla",  
  year: 2018,  
  features: {  
    color: "red",  
  },  
  passenges: [  
    "John",  
    "Lena"  
  ]  
}
```

featuresSchema = ["features", ObjectType.Object, ["color"]]  
passengersSchema = ["passengers", ObjectType.Array, [null, null]];  
schema(car) = [ ObjectType.Object, [ "make", "year", featuresSchema, passengerSchema ] ]

More generally speaking, schema is determined by (1) the type of variable for which schema is created, and (2) whether this variable is contained within some other object as a value for a property with a name. Table below contains all permutations of those two factors:

[comment]: # (Markdown for table below is auto-generated and renders correctly)
[comment]: # (Generator URL: https://www.tablesgenerator.com/markdown_tables)

| Is a named property value | Primitive     | Array                                                                          | Object                                                                         |
|---------------------------|---------------|--------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| FALSE                     | null          | [ObjectType.Array, [Array of array values' recursive Schemas]]                 | [ObjectType.Object, [Array of array values' recursive Schemas]]                |
| TRUE                      | Property name | [Property name, ObjectType.Array, [Array of object values' recursive Schemas]] | [Property name, ObjectType.Array, [Array of object values' recursive Schemas]] |

[comment]: # (End of table)