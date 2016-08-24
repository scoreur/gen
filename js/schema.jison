%{

%}

%lex

DIGIT           =	(\d)
NEWLINE         =	(\r|\n|\r\n)
SPACE           =	([ |\t|\f|\v])
COMMENT         =	("%"[^\r\n]*{NEWLINE})
STRING          =   (\"[^\"]+\")
IDENT           =   ([a-zA-z]\w*)
SIMP_OP         =   (";"|"{"|"}"|"["|"]"|":"|","|"="|"->"|"("|")"|"<"|">")
BOOL            =   ("true"|"false")

DIGITS          =   ([+-]?[\d.]+)

%%

\s+         /* skip */
{COMMENT}   /* skip */
{STRING}    {return 'STRING';}
{SIMP_OP}   {return yytext;}
{BOOL}      {return yytext;}
{DIGITS}    {return 'DIGITS';}

{IDENT}     {return 'IDENT';}


<<EOF>>     {return 'EOF';}
.           {console.log('unrecognized token: ', yytext);}

/lex

%start e

%%

e :
  e EOF
  {
    $$ = $1;
    return $$;
  }
  | e RULE
  {
    $1[$2[0]] = $2[1];
    $$ = $1;
  }
  |
  {
    $$ = {};
  }
  ;

RULE :
  R ";"
  {
    $$ = $1;
  }
  | IDENT "=" "{" IDENT ',' OPTIONS "}" ";"
  {
    $$ = [$1, {mode: $4}];
    Object.assign($$[1], $6);
  }
  ;


R :
  IDENT "->" NODES
  {
    $$ = [$1, {structure: [], node: $3, action:{}}];
  }
  | R IDENT "{" ACTION "}"
  {
    if($4 != null){
        $1[1].action[ '_' + $1[1].structure.length + "_" + $2] = $4;
    }

    $1[1].structure.push($2);

  }
  | R IDENT
  {
    $1[1].structure.push($2);
  }
  ;


NODES :
  "{" e "}"
  {
    $$ = $2;
  }
  |
  {
    $$ = {}
  }
  ;

ACTION :
  IDENT "," OPTIONS
  {
    $$ = {};
    $$.mode = $1;
    Object.assign($$, $3);
  }
  ;


OPTION :
  IDENT ":" VAR
  {
    $$ = [$1, $3];
  }
  ;
OPTIONS :
  OPTION
  {
    $$ = {};
    $$[$1[0]] = $1[1];
  }
  | OPTIONS "," OPTION
  {
    $1[$3[0]] = $3[1];
    $$ = $1;
  }
  ;

NUMBER :
  DIGITS
  { $$ = parseFloat($1);}
  ;

BOOL :
  "true"
  {
    $$ = true;
  }
  | "false"
  {
    $$ = false;
  }
  ;

VAR :
  BOOL
  { $$ = $1;}
  |
  NUMBER
  { $$ = $1;}
  | IDENT
  { $$ = $1;}
  | STRING
  { $$ = $1.substr(1,$1.length - 2);}
  | "{" "}"
  { $$ = {};}
  | "[" LIST "]"
  { $$ = $2;}
  | "{" OPTIONS "}"
  { $$ = $2;}
  ;

LIST :
  { $$ = [];}
  | VAR
  { $$ = [$1];}
  | LIST "," VAR
  { $1.push($3); $$ = $1;}
  ;