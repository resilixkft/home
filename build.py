import sys
parts=['engine.js','sound.js','textures.js','builder.js','exterior.js','interior.js','desk.js','bedroom.js','bathroom.js','kidsroom.js','living.js','site.js','blaster.js','app.js']
js='\n'.join(open('src/'+p).read() for p in parts)
shell=open('src/shell.html').read()
wrap=open('src/wrapper_head.html').read()
page=wrap+'\n'+shell+'\n<script>\n'+js+'\n</script>\n\n</body></html>'
open('dist/klinker-house.html','w').write(page)
open('dist/test.html','w').write(page)
open('index.html','w').write(page)  # the published page (GitHub Pages serves it from the repository root)
print(len(page))
