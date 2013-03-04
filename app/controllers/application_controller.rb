class ApplicationController < ActionController::Base
    protect_from_forgery

    def index
        # Create pinwheels object
        $pinwheels = {}
        pinwheels = Pinwheel.joins{ skills }.includes{ skills }.order{ name }
        pinwheels.each do |pinwheel|
            $pinwheels[pinwheel.name.parameterize('_')] = {
                :unid => pinwheel.id,
                :name => pinwheel.name,
                :skills => pinwheel.skills.collect{ |s| s.name.parameterize('_') }
            }
        end
        
        # Create skills object
        $skills = {}
        skills = Skill.joins{ |s| s.pinwheels }.includes{ |s| s.pinwheels }.order{ name }
        skills.each do |skill|
            $skills[skill.name.parameterize('_')] = {
                :unid => skill.id,
                :name => skill.name,
                :pinwheels => skill.pinwheels.collect{ |p| p.name.parameterize('_') }
            }
        end

        render :template => 'index'
    end
end
