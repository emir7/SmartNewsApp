
  Pod::Spec.new do |s|
    s.name = 'MachineLearning'
    s.version = '0.0.1'
    s.summary = 'ml'
    s.license = 'MIT'
    s.homepage = 'https://emirha7@bitbucket.org/emirha7/smartnewsfeedbrowsing.git'
    s.author = 'emir'
    s.source = { :git => 'https://emirha7@bitbucket.org/emirha7/smartnewsfeedbrowsing.git', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
  end