create database 6IV8;
use 6IV8;
create table usuario (
id integer auto_increment,
nombre char(120),
PRIMARY KEY (id)
)
;
select * from usuario;
DELETE usuario FROM usuario;