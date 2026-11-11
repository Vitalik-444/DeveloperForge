import { Braces, Code2, LockKeyhole, WandSparkles, Type, Globe, FileCode2, Palette, Clock3, Hash, Regex, Fingerprint, FileJson, Link2, ScanText, Binary } from 'lucide-react';
export const tools = [
{id:'json-formatter',name:'JSON Formatter & Validator',category:'JSON Tools',description:'Format, minify, and validate JSON data.',keywords:'pretty print parse object',icon:Braces,popular:true},
{id:'json-to-typescript',name:'JSON to TypeScript',category:'JSON Tools',description:'Generate typed interfaces from JSON.',keywords:'interface types type generator',icon:FileJson,popular:true},
{id:'base64',name:'Base64 Encoder & Decoder',category:'Encoders & Decoders',description:'Encode and decode UTF-8 text.',keywords:'base64 encode decode',icon:Binary,popular:true},
{id:'url-encoder',name:'URL Encoder & Decoder',category:'Encoders & Decoders',description:'Safely encode or decode URL components.',keywords:'url uri percent encode',icon:Link2,popular:true},
{id:'jwt-decoder',name:'JWT Decoder',category:'Encoders & Decoders',description:'Inspect token headers and payloads locally.',keywords:'jwt token json web token',icon:LockKeyhole,popular:true},
{id:'uuid-generator',name:'UUID Generator',category:'Generators',description:'Generate cryptographically secure UUID v4 IDs.',keywords:'guid random identifier',icon:Fingerprint,popular:true},
{id:'hash-generator',name:'Hash Generator',category:'Generators',description:'Create SHA digests with Web Crypto.',keywords:'sha sha1 sha256 sha512 checksum',icon:Hash},
{id:'regex-tester',name:'Regex Tester',category:'Code Tools',description:'Test patterns, flags, matches, and positions.',keywords:'regular expression regexp',icon:Regex},
{id:'html-formatter',name:'HTML Formatter',category:'Code Tools',description:'Format or compact HTML source safely.',keywords:'markup prettify minify',icon:Code2},
{id:'css-formatter',name:'CSS Formatter & Minifier',category:'Code Tools',description:'Tidy CSS or remove unnecessary whitespace.',keywords:'styles stylesheet',icon:Palette},
{id:'javascript-formatter',name:'JavaScript Formatter',category:'Code Tools',description:'Format JavaScript with Prettier or compact it.',keywords:'js beautify minify',icon:FileCode2},
{id:'markdown-preview',name:'Markdown Preview',category:'Text Utilities',description:'Write Markdown with a live rendered preview.',keywords:'md readme editor',icon:Type},
{id:'html-entities',name:'HTML Entity Encoder & Decoder',category:'Encoders & Decoders',description:'Encode and decode HTML-sensitive characters.',keywords:'entities escape unescape',icon:ScanText},
{id:'color-converter',name:'Color Converter',category:'Web Utilities',description:'Convert HEX, RGB, and HSL color values.',keywords:'colour picker rgba hsla',icon:Palette},
{id:'timestamp-converter',name:'Timestamp Converter',category:'Web Utilities',description:'Convert Unix timestamps and dates.',keywords:'epoch unix date time',icon:Clock3}
];
export const categories = ['JSON Tools','Code Tools','Encoders & Decoders','Generators','Text Utilities','Web Utilities'];
