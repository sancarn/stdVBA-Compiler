// prettier-ignore


const chevrotain = require("chevrotain")
//import chevrotain from "chevrotain"
  

const Lexer = chevrotain.Lexer
const createToken = chevrotain.createToken

//VarName
const VarName  = createToken({name: "VarName", pattern: /[a-zA-Z_x7f-xff][a-zA-Z0-9_x7f-xff]*/i});

//Structural and Keywords
const Declare  = createToken({name: "Declare", pattern: /declare/i,longer_alt: VarName});
const XFunction = createToken({name: "Function", pattern: /function/i,longer_alt: VarName});
const Sub      = createToken({name: "Sub", pattern: /sub/i,longer_alt: VarName});
const End      = createToken({name: "End", pattern: /end/i,longer_alt: VarName});
const TypeDef  = createToken({name: "TypeDef", pattern: /as/i,longer_alt: VarName});
const VarDef   = createToken({name: "VarDef", pattern: /dim/i,longer_alt: VarName});
const Comma    = createToken({name: "Comma", pattern: /,/i,longer_alt: VarName});
const If        = createToken({name: "If", pattern: /if/i,longer_alt: VarName});
const Then      = createToken({name: "Then", pattern: /then/i,longer_alt: VarName});
const Else      = createToken({name: "Else", pattern: /else/i,longer_alt: VarName});
const Elseif    = createToken({name: "Elseif", pattern: /elseif/i,longer_alt: VarName});

const ByRef    = createToken({name: "ByRef", pattern: /byref/i,longer_alt: VarName});
const ByVal    = createToken({name: "ByVal", pattern: /byval/i,longer_alt: VarName});
const NParam   = createToken({name: "NameParamSetter", pattern: /:=/i,longer_alt: VarName});
const XComment  = createToken({name: "Comment", pattern: /\'.*/i});
const XSet      = createToken({name: "Set", pattern: /set/i,longer_alt: VarName});


//Values
const Bool     = createToken({name: "Bool", pattern: /true|false/i,longer_alt: VarName});
const Double   = createToken({name: "Double", pattern: /(?:\d+)?\.\d+/i,longer_alt: VarName});
const Long     = createToken({name: "Long", pattern: /-?(\&H[0-9a-f]+|\d+)/i,longer_alt: VarName});
const XString   = createToken({name: "String", pattern: /"(""|[^"])*"/i,longer_alt: VarName});

//Operations
const Equals   = createToken({name: "Equals", pattern: /=/i});
const NotEqual = createToken({name:"NotEqual", pattern: /\<\>/})
const Add      = createToken({name: "Add",  pattern: /\+/i});
const Subtract = createToken({name: "Subtract",  pattern: /\-/i});
const Multiply = createToken({name: "Multiply", pattern: /\*/i});
const Divide   = createToken({name: "Divide", pattern: /\//i});
const GreaterThanOrEqualTo = createToken({name: "GreaterThanOrEqualTo", pattern: /\>\=/i});
const GreaterThan          = createToken({name: "GreaterThan", pattern: /\>/i});
const LessThanOrEqualTo    = createToken({name: "LessThanOrEqualTo", pattern: /\<\=/i});
const LessThan             = createToken({name: "LessThan", pattern: /\</i});
const Power                = createToken({name:"Power", pattern: /\^/})
const And               = createToken({name:"And", pattern: /and/i, longer_alt:VarName})
const Or                = createToken({name:"Or", pattern: /or/i, longer_alt:VarName})
const Concatenate       = createToken({name:"Concatenate", pattern: /\&/})

//Object only operators
const ObjectPropertyAccessor = createToken({name:"ObjectPropertyAccessor", pattern: /\./})
const ObjectEvaluatorAccessor = createToken({name: "ObjectEvaluatorAccessor", pattern:/\!(?:\[[^\]]*\]|\w+)?/})

const allOperators = [Equals   ,NotEqual ,Add      ,Subtract ,Multiply ,Divide   ,GreaterThanOrEqualTo,GreaterThan,LessThanOrEqualTo,LessThan,Power,And,Or,Concatenate]

//Unary operators
const Not      = createToken({name:"Not", pattern: /not/i, longer_alt:VarName})

const LBracket = createToken({name: "LBracket", pattern: /\(/i});
const RBracket = createToken({name: "RBracket", pattern: /\)/i});

const NewLine = createToken({
  name: "NewLine",
  pattern: /(?:\r|\n|:)+/i
});
const Space    = createToken({
  name: "Space", 
  pattern:/ +/i, 
  group: Lexer.SKIPPED
})
const LineCont = createToken({
  name: "LineCont",
  pattern: / _ *\r?\n?/i,
  group: Lexer.SKIPPED
});

// Labels only affect error messages and Diagrams.
LBracket.LABEL = "'('";
RBracket.LABEL = "')'";
Comma.LABEL = "','";



const vbaTokens = [
  NParam, 
  LineCont, 
  Space,
  NewLine, 
  Comment,
  Declare,
  XFunction,
  Sub,
  End,
  TypeDef,
  VarDef,
  If,
  Elseif,
  Else,
  Then,
  Comma,
  ByRef,
  ByVal,
  Bool,
  Double,
  Long,
  String,
  LBracket,
  RBracket,
  ObjectPropertyAccessor,
  ObjectEvaluatorAccessor,
  ...allOperators,
  Not,
  VarName
];

const VbaLexer = new Lexer(vbaTokens, {
// Less position info tracked, reduces verbosity of the playground output.
positionTracking: "onlyStart"
});


// ----------------- parser -----------------
const CstParser = chevrotain.CstParser

//TODO: Implement method calls in 
//TODO: Implement property accessor `a.b`, Determining between property and method access might be difficult :/ not sure it's required either though ofc. Might be useful for intellisense not sure...


class VbaParser extends CstParser {
  constructor() {
    super(vbaTokens, {
      recoveryEnabled: false
    })

    // very important to call this after all the rules have been setup.
    // otherwise the parser may not work correctly as it will lack information
    // derived from the self analysis.
    this.performSelfAnalysis();
  }

  moduleBody = this.RULE("moduleBody",()=>{
    //this.MANY(()=>this.SUBRULE(this.moduleHeaderLine))
    this.MANY(()=>this.SUBRULE(this.moduleLine))
  })

  moduleLine = this.RULE("moduleLine",()=>{
    this.OPTION(()=>{
      this.OR([
        {ALT:()=>this.SUBRULE(this.subDefinition)},
        {ALT:()=>this.SUBRULE(this.functionDefinition)},
        {ALT:()=>this.SUBRULE(this.comment)},
      ])
    })
    
    this.CONSUME(NewLine)
  })


  //Sub Syntax:
  //  Sub name(...parameters...): ...body... :End Sub
  //Sub examples:
  //  Sub plant: ... :End Sub
  //  Sub plant(somePlant as plant): ... :End Sub
  //  Sub plant(ByVal times as integer, ByRef somePlant as plant, ByRef Forest as PlantCollection): ... :End Sub
  subDefinition = this.RULE("subDefinition", ()=>{
    this.CONSUME(Sub)
    this.CONSUME(VarName)
    //Parameters
    this.OPTION(()=>{
      this.SUBRULE(this.parametersDefinition)
    })
    /* No TypeDef in Sub*/
    this.CONSUME(NewLine)
    this.SUBRULE(this.block)
    this.CONSUME(End)
    this.CONSUME2(Sub)
  })

  //Function Syntax:
  //  Function name(...parameters...) as something: ...body... :End Function
  //Function examples:
  //  Function tree as plant: ... :End Function
  //  Function tree(height as integer) as plant: ... :End Function
  //  Function tree(ByVal height as integer, ByRef Forest as PlantCollection) as plant: ... :End Function
  functionDefinition = this.RULE("functionDefinition", ()=>{
    this.CONSUME(XFunction)
    this.CONSUME(VarName)
    //Parameters
    this.OPTION(()=>{
      this.SUBRULE(this.parametersDefinition)
    })
    this.CONSUME(TypeDef)
    this.CONSUME2(VarName)
    this.CONSUME(NewLine)
    this.SUBRULE(this.block)
    this.CONSUME(End)
    this.CONSUME2(XFunction)
  })
  parametersDefinition = this.RULE("parametersDefinition",()=>{
    this.CONSUME(LBracket)
    this.OPTION(()=>{
      this.MANY_SEP({
        SEP:Comma,
        DEF:()=>{
          this.OPTION2(()=>{
            this.OR([
              {ALT:()=>{this.CONSUME(ByVal)}},
              {ALT:()=>{this.CONSUME(ByRef)}}
            ]);
          });
          this.CONSUME(VarName);
          this.OPTION3(()=>{
            //Type definition option
            this.CONSUME(TypeDef);
            this.CONSUME2(VarName);
          })
        }
      })
    })
    this.CONSUME(RBracket);
  })

  block = this.RULE("block",()=>{
    this.MANY(()=>{
      this.SUBRULE(this.blockLine)
    })
  })
  blockLine = this.RULE("blockLine",()=>{
    this.OPTION(()=>{
      this.OR([
        {ALT:()=>this.SUBRULE(this.localVariableDeclaration)},
        {ALT:()=>this.SUBRULE(this.assignment)},
        {ALT:()=>this.SUBRULE(this.ifStatement)}
      ])
    })
    this.OPTION2(()=>{
      this.SUBRULE(this.comment)
    })
    this.CONSUME(NewLine)
  })
  ifStatement = this.RULE("ifStatement",()=>{
    this.CONSUME(If)
    this.SUBRULE(this.expression)
    this.CONSUME(Then)
    this.CONSUME(NewLine)
    this.SUBRULE(this.block)
    this.OPTION(()=>{
      this.MANY(()=>{
        this.CONSUME(Elseif)
        this.SUBRULE2(this.expression)
        this.CONSUME2(Then)
        this.CONSUME2(NewLine)
        this.SUBRULE2(this.block)
      })
    })
    this.OPTION2(()=>{
      this.CONSUME(Else)
      this.CONSUME3(NewLine)
      this.SUBRULE3(this.block)
    })
    this.CONSUME(End)
    this.CONSUME2(If)
  })
  
  localVariableDeclaration = this.RULE("localVariableDeclaration",()=>{
    this.CONSUME(VarDef)
    this.CONSUME(VarName)
    this.OPTION(()=>{
      this.CONSUME(TypeDef)
      this.CONSUME2(VarName)
    })
  })
  assignment = this.RULE("assignment",()=>{
    this.OPTION(()=>{
      this.CONSUME(XSet);
    });
    this.CONSUME(VarName);
    this.CONSUME(Equals);
    this.SUBRULE(this.expression);
  })
  expression = this.RULE("expression",()=>{
    this.SUBRULE(this.valueGroup)
    this.MANY(()=>{
        this.SUBRULE(this.binOperator)
        this.SUBRULE(this.expression)
    });
  })

  valueGroup = this.RULE("valueGroup",()=>{
    this.OR([
      {ALT:()=>{
        this.CONSUME(LBracket)
        this.SUBRULE(this.expression)
        this.CONSUME(RBracket)
      }},
      {ALT:()=>{
        this.SUBRULE(this.unaryOperator)
        this.SUBRULE2(this.expression)
      }},
      {ALT:()=>{
        this.SUBRULE(this.value)
      }},
    ])
  })
  value = this.RULE("value",()=>{
    this.OR([
      {ALT:()=>{
        this.SUBRULE(this.literal)
      }},
      {ALT:()=>{
        this.CONSUME(VarName)
      }}
    ])
  })

  unaryOperator = this.RULE("unaryOperator",()=>{
    this.OR([
      {ALT: ()=>this.CONSUME(Not)},
    ])
  })
  binOperator = this.RULE("binOperator",()=>{
    let arr = allOperators.map(token=>({ALT:()=>this.CONSUME(token)}))
    this.OR(arr)
  })
  literal = this.RULE("literal",()=>{
    this.OR([
      {ALT: ()=>this.CONSUME(XString)},
      {ALT: ()=>this.CONSUME(Long)},
      {ALT: ()=>this.CONSUME(Double)},
      {ALT: ()=>this.CONSUME(Bool)}
    ])
  })
  
  comment = this.RULE("comment",()=>this.CONSUME(XComment))
}

function parse(stringToParse){
  //Lex it
  const lexed = VbaLexer.tokenize(stringToParse)
  
  //If lexer errors return
  if(lexed.errors.length>0){
    return lexed.errors
  } else {
    //No errors, ready to parse
    
    //Parse with parser
    const parser = new VbaParser
    parser.input = lexed.tokens;

    //Call function to parse tokens
    const ast = parser.moduleBody()

    //If errors return those, else return ast
    if(parser.errors.length > 0){
      return parser.errors;
    } else {
      return ast
    }
  }
}




console.log(JSON.stringify(parse(`
  Function poop() as string
    x= 5 - 4 AND NOT 6
  End Function

  Sub bag
    if true then
      x=2
    else
      x=1
    end if
  End Sub
`)))




