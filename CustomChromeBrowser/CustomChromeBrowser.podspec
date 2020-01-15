
  Pod::Spec.new do |s|
    s.name = 'CustomChromeBrowser'
    s.version = '0.0.1'
    s.summary = 'trying to implement browser with onclose event'
    s.license = 'MIT'
    s.homepage = 'git clone https://emirha7@bitbucket.org/emirha7/smartnewsfeedbrowsing.git'
    s.author = 'emir'
    s.source = { :git => 'git clone https://emirha7@bitbucket.org/emirha7/smartnewsfeedbrowsing.git', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
  end