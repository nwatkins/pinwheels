# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

ActiveRecord::Base.connection.execute("TRUNCATE pinwheels_skills")
ActiveRecord::Base.connection.execute("TRUNCATE #{Skill.table_name}")
ActiveRecord::Base.connection.execute("TRUNCATE #{Perk.table_name}")
ActiveRecord::Base.connection.execute("TRUNCATE #{Pinwheel.table_name}")

pinwheels = {}
pinwheel_file = File.join(Rails.root, 'lib', 'assets', 'pinwheels.yml')
pinwheels_data = YAML::load(File.open(pinwheel_file))
pinwheels_data.each do |key, value|
    pinwheel = Pinwheel.create do |p|
        p.id = value['unid']
        p.name = value['name']
    end
    pinwheels[key] = pinwheel
end

skills = {}
skills_file = File.join(Rails.root, 'lib', 'assets', 'skills.yml')
skills_data = YAML::load(File.open(skills_file))
skills_data.each do |key, value|
    skill = Skill.create do |s|
        s.id = value['unid']
        s.name = value['name']
    end

    value['pinwheels'].each do |name|
        pinwheel = pinwheels[name]
        pinwheel.skills << skill
    end
end
